const router = require('express').Router()

// POST /api/ai/chat — agente conversacional (A7)
router.post('/chat', async (req, res) => {
  // TODO: conectar con orchestrator → conversational agent
  res.json({ respuesta: 'Agente conversacional — próximamente Fase 1' })
})

// POST /api/ai/analyze — agente analista (A1)
router.post('/analyze', async (req, res) => {
  res.json({ analisis: 'Agente analista — próximamente Fase 1' })
})

// POST /api/ai/optimize — agente optimizador (A2)
router.post('/optimize', async (req, res) => {
  res.json({ recomendaciones: 'Agente optimizador — próximamente Fase 2' })
})

// POST /api/ai/copy — agente copywriter (A3)
router.post('/copy', async (req, res) => {
  res.json({ copies: 'Agente copywriter — próximamente Fase 2' })
})

module.exports = router
