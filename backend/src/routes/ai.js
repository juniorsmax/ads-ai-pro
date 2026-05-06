const router = require('express').Router()
const auth = require('../middleware/auth')
const orchestrator = require('../agents/orchestrator')
const performanceAnalyst = require('../agents/performanceAnalyst')
const supabase = require('../services/supabase')
const cache = require('../services/cache')

// POST /api/ai/chat — agente conversacional vía orquestador
router.post('/chat', auth, async (req, res) => {
  const { mensaje, historial, cuentaId } = req.body
  if (!mensaje?.trim()) return res.status(400).json({ error: 'Mensaje requerido' })

  let accountSummary = null
  if (cuentaId) {
    accountSummary = await cache.get(`account_summary:${cuentaId}`)
  }

  try {
    const respuesta = await orchestrator.handle({ mensaje, historial, accountSummary })

    // Guardar log en Supabase
    await supabase.from('logs_ia').insert({
      usuario_id: req.user.userId,
      cuenta_id: cuentaId,
      agente: 'conversacional',
      input: mensaje,
      output: respuesta,
    }).catch(() => {}) // No bloquear si el log falla

    res.json({ respuesta })
  } catch (err) {
    console.error('[AI chat]', err.message)
    res.status(500).json({ error: 'Error en el agente de IA. Inténtalo de nuevo.' })
  }
})

// POST /api/ai/analyze — agente analista de rendimiento
router.post('/analyze', auth, async (req, res) => {
  const { cuentaId } = req.body
  if (!cuentaId) return res.status(400).json({ error: 'cuentaId requerido' })

  const accountSummary = await cache.get(`account_summary:${cuentaId}`)
  if (!accountSummary) {
    return res.status(400).json({ error: 'Sincroniza la cuenta primero para obtener datos actuales' })
  }

  try {
    const analisis = await performanceAnalyst.analyze(accountSummary)

    await supabase.from('logs_ia').insert({
      usuario_id: req.user.userId,
      cuenta_id: cuentaId,
      agente: 'analista',
      input: 'analyze',
      output: analisis,
    }).catch(() => {})

    res.json({ analisis })
  } catch (err) {
    console.error('[AI analyze]', err.message)
    res.status(500).json({ error: 'Error en el agente analista' })
  }
})

// POST /api/ai/optimize — agente optimizador (Fase 2)
router.post('/optimize', auth, async (req, res) => {
  res.json({ mensaje: 'Agente optimizador — disponible en Fase 2' })
})

// POST /api/ai/copy — agente copywriter (Fase 2)
router.post('/copy', auth, async (req, res) => {
  res.json({ mensaje: 'Agente copywriter — disponible en Fase 2' })
})

module.exports = router
