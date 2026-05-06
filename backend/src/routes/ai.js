const router = require('express').Router()
const auth = require('../middleware/auth')
const { chatPorUsuario } = require('../middleware/rateLimiter')
const { aiChat, aiAnalyze, aiOptimize, aiCopy, aiCopyAudit, aiAlertsCheck } = require('../middleware/validators')
const orchestrator = require('../agents/orchestrator')
const performanceAnalyst = require('../agents/performanceAnalyst')
const optimizer = require('../agents/optimizer')
const copywriter = require('../agents/copywriter')
const { checkAccount } = require('../agents/alertMonitor')
const supabase = require('../services/supabase')
const cache = require('../services/cache')

// POST /api/ai/chat — orquestador principal (20 msg/hora por usuario)
router.post('/chat', auth, chatPorUsuario, aiChat, async (req, res) => {
  const { mensaje, historial, cuentaId, objetivos } = req.body
  if (!mensaje?.trim()) return res.status(400).json({ error: 'Mensaje requerido' })

  const accountSummary = cuentaId ? await cache.get(`account_summary:${cuentaId}`) : null

  try {
    const resultado = await orchestrator.handle({ mensaje, historial, accountSummary, objetivos })

    await supabase.from('logs_ia').insert({
      usuario_id: req.user.userId,
      cuenta_id: cuentaId ?? null,
      agente: 'orquestador',
      input: mensaje,
      output: typeof resultado.contenido === 'string' ? resultado.contenido : JSON.stringify(resultado.contenido),
    }).catch(() => {})

    res.json(resultado)
  } catch (err) {
    console.error('[AI chat]', err.message)
    res.status(500).json({ error: 'Error en el agente de IA. Inténtalo de nuevo.' })
  }
})

// POST /api/ai/analyze — análisis de rendimiento (Agente 1)
router.post('/analyze', auth, aiAnalyze, async (req, res) => {
  const { cuentaId } = req.body
  if (!cuentaId) return res.status(400).json({ error: 'cuentaId requerido' })

  const accountSummary = await cache.get(`account_summary:${cuentaId}`)
  if (!accountSummary) {
    return res.status(400).json({ error: 'Sincroniza la cuenta primero para obtener datos actuales' })
  }

  try {
    const analisis = await performanceAnalyst.analyze(accountSummary)
    await logIA(req.user.userId, cuentaId, 'analista', 'analyze', analisis)
    res.json({ analisis })
  } catch (err) {
    console.error('[AI analyze]', err.message)
    res.status(500).json({ error: 'Error en el agente analista' })
  }
})

// POST /api/ai/optimize — optimizador de pujas y presupuesto (Agente 2)
router.post('/optimize', auth, aiOptimize, async (req, res) => {
  const { cuentaId, objetivos } = req.body
  if (!cuentaId) return res.status(400).json({ error: 'cuentaId requerido' })

  const accountSummary = await cache.get(`account_summary:${cuentaId}`)
  if (!accountSummary) {
    return res.status(400).json({ error: 'Sincroniza la cuenta primero' })
  }

  try {
    const recomendaciones = await optimizer.optimize(accountSummary, objetivos ?? {})
    await logIA(req.user.userId, cuentaId, 'optimizador', 'optimize', JSON.stringify(recomendaciones))
    res.json(recomendaciones)
  } catch (err) {
    console.error('[AI optimize]', err.message)
    res.status(500).json({ error: 'Error en el agente optimizador' })
  }
})

// POST /api/ai/copy — copywriter IA (Agente 3)
router.post('/copy', auth, aiCopy, async (req, res) => {
  const { tipo = 'RSA', keywords, perfilMarca, copiesActuales } = req.body

  try {
    const copies = await copywriter.generateCopy(tipo, { keywords, perfilMarca, copiesActuales })
    await logIA(req.user.userId, null, 'copywriter', tipo, JSON.stringify(copies))
    res.json(copies)
  } catch (err) {
    console.error('[AI copy]', err.message)
    res.status(500).json({ error: 'Error en el agente copywriter' })
  }
})

// POST /api/ai/copy/audit — auditoría de copies existentes
router.post('/copy/audit', auth, aiCopyAudit, async (req, res) => {
  const { copies } = req.body
  if (!copies?.length) return res.status(400).json({ error: 'copies requeridos' })

  try {
    const auditoria = await copywriter.auditCopy(copies)
    res.json(auditoria)
  } catch (err) {
    console.error('[AI copy audit]', err.message)
    res.status(500).json({ error: 'Error en la auditoría de copies' })
  }
})

// POST /api/ai/alerts/check — chequeo manual de alertas
router.post('/alerts/check', auth, aiAlertsCheck, async (req, res) => {
  const { cuentaId } = req.body
  if (!cuentaId) return res.status(400).json({ error: 'cuentaId requerido' })

  const summaryActual = await cache.get(`account_summary:${cuentaId}`)
  const summaryAnterior = await cache.get(`account_summary_prev:${cuentaId}`)

  try {
    const resultado = await checkAccount(cuentaId, summaryActual, summaryAnterior)
    res.json(resultado)
  } catch (err) {
    console.error('[AI alerts]', err.message)
    res.status(500).json({ error: 'Error en el monitor de alertas' })
  }
})

// GET /api/ai/alerts — obtener alertas activas de la cuenta
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
