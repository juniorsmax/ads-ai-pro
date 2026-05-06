const router = require('express').Router()
const auth = require('../middleware/auth')
const { chatPorUsuario, iaNoAuth } = require('../middleware/rateLimiter')
const { checkIA } = require('../middleware/planLimiter')
const { aiChat, aiAnalyze, aiOptimize, aiCopy, aiCopyAudit, aiAlertsCheck } = require('../middleware/validators')
const orchestrator = require('../agents/orchestrator')
const performanceAnalyst = require('../agents/performanceAnalyst')
const optimizer = require('../agents/optimizer')
const copywriter = require('../agents/copywriter')
const conversational = require('../agents/conversational')
const { checkAccount } = require('../agents/alertMonitor')
const { registrarUso, estaIAPausada, getCosteDiario } = require('../services/tokenTracker')
const { PLANES } = require('../services/stripe')
const supabase = require('../services/supabase')
const cache = require('../services/cache')

// Rate limit para IPs no autenticadas — aplicado antes de auth en todas las rutas de IA
router.use(iaNoAuth)

// ── GET /api/ai/usage ────────────────────────────────────────────────────────
// Devuelve el consumo del usuario: mensajes del mes, coste y estado del circuit breaker
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
  const limite = plan.chatMensual   // null = ilimitado
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
// Orquestador principal — respuesta completa (20 msg/hora por usuario)
router.post('/chat', auth, chatPorUsuario, ...checkIA, aiChat, async (req, res) => {
  const { mensaje, historial, cuentaId, objetivos } = req.body
  if (!mensaje?.trim()) return res.status(400).json({ error: 'Mensaje requerido' })

  const accountSummary = cuentaId ? await cache.get(`account_summary:${cuentaId}`) : null

  try {
    const resultado = await orchestrator.handle({ mensaje, historial, accountSummary, objetivos })

    // El primer elemento es detectIntent (Haiku, interno) → esPrincipal=false
    // El resto son llamadas principales del usuario → esPrincipal=true
    const usages = resultado.usages ?? []
    for (let i = 0; i < usages.length; i++) {
      const { model, usage } = usages[i]
      await registrarUso(req.user.userId, 'orquestador', model, usage, i > 0)
    }

    await logIA(req.user.userId, cuentaId, 'orquestador', mensaje,
      typeof resultado.contenido === 'string' ? resultado.contenido : JSON.stringify(resultado.contenido))

    res.json({ tipo: resultado.tipo, contenido: resultado.contenido })
  } catch (err) {
    console.error('[AI chat]', err.message)
    res.status(500).json({ error: 'Error en el agente de IA. Inténtalo de nuevo.' })
  }
})

// ── POST /api/ai/chat/stream ─────────────────────────────────────────────────
// Orquestador con streaming SSE — el texto llega en tiempo real
// Eventos SSE: intent | delta | json | done | error
router.post('/chat/stream', auth, chatPorUsuario, ...checkIA, aiChat, async (req, res) => {
  const { mensaje, historial, cuentaId, objetivos } = req.body
  if (!mensaje?.trim()) return res.status(400).json({ error: 'Mensaje requerido' })

  // Cabeceras SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const sse = (event, data) => {
    if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    const accountSummary = cuentaId ? await cache.get(`account_summary:${cuentaId}`) : null

    // Paso 1 — detectIntent (síncrono, muy rápido con Haiku)
    const { intent, usage: usageIntent, model: modelIntent } = await orchestrator.detectIntent(mensaje)
    sse('intent', { intent })
    if (usageIntent) await registrarUso(req.user.userId, 'orquestador', modelIntent, usageIntent, false)

    // Paso 2 — ejecutar agente con streaming cuando sea posible
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
      // general / fallback (también cubre 'analyze' sin datos de cuenta)
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
router.post('/analyze', auth, ...checkIA, aiAnalyze, async (req, res) => {
  const { cuentaId } = req.body
  if (!cuentaId) return res.status(400).json({ error: 'cuentaId requerido' })

  const accountSummary = await cache.get(`account_summary:${cuentaId}`)
  if (!accountSummary) {
    return res.status(400).json({ error: 'Sincroniza la cuenta primero para obtener datos actuales' })
  }

  try {
    const { data: analisis, usage, model, fromRule } = await performanceAnalyst.analyze(accountSummary, cuentaId)
    await registrarUso(req.user.userId, 'analista', model, usage)
    if (!fromRule) await logIA(req.user.userId, cuentaId, 'analista', 'analyze', analisis)
    res.json({ analisis, fromRule: fromRule ?? false })
  } catch (err) {
    console.error('[AI analyze]', err.message)
    res.status(500).json({ error: 'Error en el agente analista' })
  }
})

// ── POST /api/ai/optimize ────────────────────────────────────────────────────
router.post('/optimize', auth, ...checkIA, aiOptimize, async (req, res) => {
  const { cuentaId, objetivos } = req.body
  if (!cuentaId) return res.status(400).json({ error: 'cuentaId requerido' })

  const accountSummary = await cache.get(`account_summary:${cuentaId}`)
  if (!accountSummary) {
    return res.status(400).json({ error: 'Sincroniza la cuenta primero' })
  }

  try {
    const { data: recomendaciones, usage, model, fromRule } = await optimizer.optimize(accountSummary, objetivos ?? {}, cuentaId)
    await registrarUso(req.user.userId, 'optimizador', model, usage)
    if (!fromRule) await logIA(req.user.userId, cuentaId, 'optimizador', 'optimize', JSON.stringify(recomendaciones))
    res.json({ ...recomendaciones, fromRule: fromRule ?? false })
  } catch (err) {
    console.error('[AI optimize]', err.message)
    res.status(500).json({ error: 'Error en el agente optimizador' })
  }
})

// ── POST /api/ai/copy ────────────────────────────────────────────────────────
router.post('/copy', auth, ...checkIA, aiCopy, async (req, res) => {
  const { tipo = 'RSA', keywords, perfilMarca, copiesActuales } = req.body

  try {
    const { data: copies, usage, model } = await copywriter.generateCopy(tipo, { keywords, perfilMarca, copiesActuales })
    await registrarUso(req.user.userId, 'copywriter', model, usage)
    await logIA(req.user.userId, null, 'copywriter', tipo, JSON.stringify(copies))
    res.json(copies)
  } catch (err) {
    console.error('[AI copy]', err.message)
    res.status(500).json({ error: 'Error en el agente copywriter' })
  }
})

// ── POST /api/ai/copy/audit ──────────────────────────────────────────────────
router.post('/copy/audit', auth, ...checkIA, aiCopyAudit, async (req, res) => {
  const { copies } = req.body
  if (!copies?.length) return res.status(400).json({ error: 'copies requeridos' })

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
