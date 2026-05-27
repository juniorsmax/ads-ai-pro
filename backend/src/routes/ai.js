const router = require('express').Router()
const auth = require('../middleware/auth')
const { chatPorUsuario } = require('../middleware/rateLimiter')
const { aiChat, aiAnalyze, aiOptimize, aiCopy, aiCopyAudit, aiAlertsCheck } = require('../middleware/validators')
const orchestrator = require('../agents/orchestrator')
const performanceAnalyst = require('../agents/performanceAnalyst')
const optimizer = require('../agents/optimizer')
const copywriter = require('../agents/copywriter')
const conversational = require('../agents/conversational')
const { checkAccount } = require('../agents/alertMonitor')
const weeklyResumen = require('../agents/weeklyResumen')
const googleAds = require('../services/googleAds')
const { registrarUso, estaIAPausada, getCosteDiario } = require('../services/tokenTracker')
const { PLANES } = require('../services/stripe')
const analytics = require('../services/analytics')
const { decrypt } = require('../services/tokenCrypto')
const supabase = require('../services/supabase')
const cache = require('../services/cache')
const { getQueue } = require('../queues/queueClient')

// ── GET /api/ai/usage ────────────────────────────────────────────────────────
router.get('/usage', auth, async (req, res) => {
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const [
    { count: usadasMes },
    { data: costeRows },
    { data: usuario },
    costeDiario,
    iaPausada,
  ] = await Promise.all([
    supabase
      .from('uso_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', req.user.userId)
      .eq('es_principal', true)
      .gte('creado_en', inicioMes.toISOString()),
    supabase
      .from('uso_tokens')
      .select('coste_usd')
      .eq('usuario_id', req.user.userId)
      .gte('creado_en', inicioMes.toISOString()),
    supabase
      .from('usuarios')
      .select('plan')
      .eq('id', req.user.userId)
      .single(),
    getCosteDiario(),
    estaIAPausada(),
  ])

  const plan = PLANES[usuario?.plan ?? 'basico'] ?? PLANES.basico
  const limite = plan.chatMensual
  const usadas = usadasMes ?? 0
  const costeMes = costeRows?.reduce((acc, r) => acc + parseFloat(r.coste_usd ?? 0), 0) ?? 0

  res.json({
    plan: {
      clave: usuario?.plan ?? 'basico',
      nombre: plan.nombre,
      limiteMensual: limite,
    },
    mensajes: {
      usadas,
      limite,
      restantes: limite ? Math.max(0, limite - usadas) : null,
      porcentaje: limite ? Math.min(100, Math.round(usadas / limite * 100)) : null,
    },
    coste: {
      hoyUsd: parseFloat(costeDiario.toFixed(4)),
      mesUsd: parseFloat(costeMes.toFixed(4)),
      limiteDiarioUsd: parseFloat(process.env.COSTE_DIARIO_LIMITE ?? '5'),
    },
    iaPausada,
  })
})

// ── POST /api/ai/chat ────────────────────────────────────────────────────────
router.post('/chat', auth, chatPorUsuario, aiChat, async (req, res) => {
  const { mensaje, historial, cuentaId, objetivos } = req.body
  if (!mensaje?.trim()) return res.status(400).json({ error: 'Mensaje requerido' })
  const t0 = Date.now()

  const accountSummary = cuentaId ? await cache.get(`account_summary:${cuentaId}`) : null

  try {
    const resultado = await orchestrator.handle({ mensaje, historial, accountSummary, objetivos })

    const usages = resultado.usages ?? []
    for (let i = 0; i < usages.length; i++) {
      const { model, usage } = usages[i]
      await registrarUso(req.user.userId, 'orquestador', model, usage, i > 0)
    }

    await logIA(req.user.userId, cuentaId, 'orquestador', mensaje,
      typeof resultado.contenido === 'string' ? resultado.contenido : JSON.stringify(resultado.contenido))

    const latencyMs = Date.now() - t0
    const lastUsage = (resultado.usages ?? []).findLast(u => u)
    if (lastUsage) {
      analytics.aiAgentCompleted(req.user.userId, 'orquestador', {
        model: lastUsage.model, usage: lastUsage.usage, latencyMs, cuentaId,
      })
    }

    res.json({ tipo: resultado.tipo, contenido: resultado.contenido })
  } catch (err) {
    console.error('[AI chat]', err.message)
    res.status(500).json({ error: 'Error en el agente de IA. Inténtalo de nuevo.' })
  }
})

// ── POST /api/ai/chat/stream ─────────────────────────────────────────────────
// SSE streaming — NO va a cola, síncrono siempre
router.post('/chat/stream', auth, chatPorUsuario, aiChat, async (req, res) => {
  const { mensaje, historial, cuentaId, objetivos } = req.body
  if (!mensaje?.trim()) return res.status(400).json({ error: 'Mensaje requerido' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const sse = (event, data) => {
    if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const accountSummary = cuentaId ? await cache.get(`account_summary:${cuentaId}`) : null

    const { intent, usage: usageIntent, model: modelIntent } = await orchestrator.detectIntent(mensaje)
    sse('intent', { intent })
    if (usageIntent) await registrarUso(req.user.userId, 'orquestador', modelIntent, usageIntent, false)

    let finalUsage = null, finalModel = null

    if (intent === 'analyze' && accountSummary) {
      ;({ usage: finalUsage, model: finalModel } = await performanceAnalyst.analyzeStream(accountSummary, sse, cuentaId))

    } else if (intent === 'optimize' && accountSummary) {
      const { data, usage, model } = await optimizer.optimize(accountSummary, objetivos ?? {}, cuentaId)
      sse('json', { tipo: 'optimizacion', data })
      finalUsage = usage; finalModel = model

    } else if (intent === 'copy') {
      const { data, usage, model } = await copywriter.generateCopy('RSA', {})
      sse('json', { tipo: 'copy', data })
      finalUsage = usage; finalModel = model

    } else {
      if (intent === 'analyze' && !accountSummary) {
        sse('delta', { text: 'Necesito datos de tu cuenta para hacer el análisis. Sincroniza tu cuenta de Google Ads primero.' })
      } else {
        ;({ usage: finalUsage, model: finalModel } = await conversational.chatStream(mensaje, historial, accountSummary, sse))
      }
    }

    if (finalUsage) await registrarUso(req.user.userId, 'orquestador', finalModel, finalUsage, true)

    sse('done', { ok: true })

    logIA(req.user.userId, cuentaId, 'orquestador', mensaje, '[stream]').catch(() => {})
  } catch (err) {
    console.error('[AI chat/stream]', err.message)
    sse('error', { message: 'Error en el agente de IA. Inténtalo de nuevo.' })
  } finally {
    res.end()
  }
})

// ── POST /api/ai/analyze ─────────────────────────────────────────────────────
router.post('/analyze', auth, aiAnalyze, async (req, res) => {
  const { cuentaId } = req.body
  if (!cuentaId) return res.status(400).json({ error: 'cuentaId requerido' })

  const accountSummary = await cache.get(`account_summary:${cuentaId}`)
  if (!accountSummary) {
    return res.status(400).json({ error: 'Sincroniza la cuenta primero para obtener datos actuales' })
  }

  const queue = getQueue('ia_job')
  if (queue) {
    const job = await queue.add('ia_job', { userId: req.user.userId, agente: 'analyze', cuentaId, payload: {} })
    return res.json({ jobId: job.id, status: 'queued' })
  }

  const t0 = Date.now()
  try {
    const { data: analisis, usage, model, fromRule } = await performanceAnalyst.analyze(accountSummary, cuentaId)
    await registrarUso(req.user.userId, 'analista', model, usage)
    if (!fromRule) await logIA(req.user.userId, cuentaId, 'analista', 'analyze', analisis)
    analytics.aiAgentCompleted(req.user.userId, 'analista', {
      model, usage, latencyMs: Date.now() - t0, cuentaId, fromCache: fromRule ?? false,
    })
    res.json({ analisis, fromRule: fromRule ?? false })
  } catch (err) {
    console.error('[AI analyze]', err.message)
    res.status(500).json({ error: 'Error en el agente analista' })
  }
})

// ── POST /api/ai/optimize ────────────────────────────────────────────────────
router.post('/optimize', auth, aiOptimize, async (req, res) => {
  const { cuentaId, objetivos } = req.body
  if (!cuentaId) return res.status(400).json({ error: 'cuentaId requerido' })

  const accountSummary = await cache.get(`account_summary:${cuentaId}`)
  if (!accountSummary) {
    return res.status(400).json({ error: 'Sincroniza la cuenta primero' })
  }

  const queue = getQueue('ia_job')
  if (queue) {
    const job = await queue.add('ia_job', { userId: req.user.userId, agente: 'optimize', cuentaId, payload: { objetivos } })
    return res.json({ jobId: job.id, status: 'queued' })
  }

  const t0 = Date.now()
  try {
    const { data: recomendaciones, usage, model, fromRule } = await optimizer.optimize(accountSummary, objetivos ?? {}, cuentaId)
    await registrarUso(req.user.userId, 'optimizador', model, usage)
    if (!fromRule) await logIA(req.user.userId, cuentaId, 'optimizador', 'optimize', JSON.stringify(recomendaciones))
    analytics.aiAgentCompleted(req.user.userId, 'optimizador', {
      model, usage, latencyMs: Date.now() - t0, cuentaId, fromCache: fromRule ?? false,
    })
    res.json({ ...recomendaciones, fromRule: fromRule ?? false })
  } catch (err) {
    console.error('[AI optimize]', err.message)
    res.status(500).json({ error: 'Error en el agente optimizador' })
  }
})

// ── POST /api/ai/copy ────────────────────────────────────────────────────────
router.post('/copy', auth, aiCopy, async (req, res) => {
  const { tipo = 'RSA', keywords, perfilMarca, copiesActuales } = req.body

  const queue = getQueue('ia_job')
  if (queue) {
    const job = await queue.add('ia_job', {
      userId:  req.user.userId,
      agente:  'copy',
      payload: { tipo, keywords, perfilMarca, copiesActuales },
    })
    return res.json({ jobId: job.id, status: 'queued' })
  }

  const t0 = Date.now()
  try {
    const { data: copies, usage, model } = await copywriter.generateCopy(tipo, { keywords, perfilMarca, copiesActuales })
    await registrarUso(req.user.userId, 'copywriter', model, usage)
    await logIA(req.user.userId, null, 'copywriter', tipo, JSON.stringify(copies))
    analytics.aiAgentCompleted(req.user.userId, 'copywriter', { model, usage, latencyMs: Date.now() - t0 })
    res.json(copies)
  } catch (err) {
    console.error('[AI copy]', err.message)
    res.status(500).json({ error: 'Error en el agente copywriter' })
  }
})

// ── POST /api/ai/copy/audit ──────────────────────────────────────────────────
router.post('/copy/audit', auth, aiCopyAudit, async (req, res) => {
  const { copies } = req.body
  if (!copies?.length) return res.status(400).json({ error: 'copies requeridos' })

  const queue = getQueue('ia_job')
  if (queue) {
    const job = await queue.add('ia_job', {
      userId:  req.user.userId,
      agente:  'copy_audit',
      payload: { copies },
    })
    return res.json({ jobId: job.id, status: 'queued' })
  }

  try {
    const { data: auditoria, usage, model } = await copywriter.auditCopy(copies)
    await registrarUso(req.user.userId, 'copywriter-audit', model, usage)
    res.json(auditoria)
  } catch (err) {
    console.error('[AI copy audit]', err.message)
    res.status(500).json({ error: 'Error en la auditoría de copies' })
  }
})

// ── POST /api/ai/alerts/check ────────────────────────────────────────────────
router.post('/alerts/check', auth, aiAlertsCheck, async (req, res) => {
  const { cuentaId } = req.body
  if (!cuentaId) return res.status(400).json({ error: 'cuentaId requerido' })

  const queue = getQueue('ia_job')
  if (queue) {
    const job = await queue.add('ia_job', {
      userId:  req.user.userId,
      agente:  'alerts',
      cuentaId,
      payload: {},
    })
    return res.json({ jobId: job.id, status: 'queued' })
  }

  const summaryActual   = await cache.get(`account_summary:${cuentaId}`)
  const summaryAnterior = await cache.get(`account_summary_prev:${cuentaId}`)

  try {
    const resultado = await checkAccount(cuentaId, summaryActual, summaryAnterior)
    res.json(resultado)
  } catch (err) {
    console.error('[AI alerts]', err.message)
    res.status(500).json({ error: 'Error en el monitor de alertas' })
  }
})

// ── GET /api/ai/alerts/:cuentaId ─────────────────────────────────────────────
router.get('/alerts/:cuentaId', auth, async (req, res) => {
  const { data } = await supabase
    .from('alertas')
    .select('*')
    .eq('cuenta_id', req.params.cuentaId)
    .order('creado_en', { ascending: false })
    .limit(20)

  res.json(data ?? [])
})

// ── GET /api/ai/job/:jobId ───────────────────────────────────────────────────
router.get('/job/:jobId', auth, async (req, res) => {
  const { data } = await supabase
    .from('job_results')
    .select('job_id, estado, resultado')
    .eq('job_id', req.params.jobId)
    .eq('usuario_id', req.user.userId)
    .single()

  if (!data) return res.status(404).json({ error: 'Job no encontrado' })
  res.json({ jobId: data.job_id, estado: data.estado, resultado: data.resultado })
})

// ── POST /api/ai/resumen-semanal ─────────────────────────────────────────────
router.post('/resumen-semanal', auth, async (req, res) => {
  const { cuentaId } = req.body
  if (!cuentaId) return res.status(400).json({ error: 'cuentaId requerido' })

  const cacheKey = `resumen_semanal:${cuentaId}`
  const cached = await cache.get(cacheKey)
  if (cached) return res.json({ ...cached, fromCache: true })

  const [{ data: cuenta }, { data: usuario }] = await Promise.all([
    supabase.from('cuentas_vinculadas').select('customer_id').eq('id', cuentaId).eq('usuario_id', req.user.userId).single(),
    supabase.from('usuarios').select('google_refresh_token').eq('id', req.user.userId).single(),
  ])
  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' })

  const t0 = Date.now()
  try {
    const dias14 = await googleAds.get14DayMetrics(decrypt(usuario.google_refresh_token), cuenta.customer_id)
    if (!dias14.length) return res.status(400).json({ error: 'Sin datos de los últimos 14 días para generar el resumen' })

    const { data, usage, model } = await weeklyResumen.generate(dias14)
    await registrarUso(req.user.userId, 'resumen-semanal', model, usage)
    await cache.set(cacheKey, data, 'CAMPAIGN_LIST')
    analytics.aiAgentCompleted(req.user.userId, 'resumen-semanal', {
      model, usage, latencyMs: Date.now() - t0, cuentaId,
    })
    res.json({ ...data, fromCache: false })
  } catch (err) {
    console.error('[Resumen semanal]', err.message)
    res.status(500).json({ error: 'Error generando el resumen semanal' })
  }
})

async function logIA(usuarioId, cuentaId, agente, input, output) {
  await supabase.from('logs_ia').insert({
    usuario_id: usuarioId,
    cuenta_id: cuentaId ?? null,
    agente,
    input,
    output,
  }).catch(() => {})
}

module.exports = router
