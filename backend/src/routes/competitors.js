const router = require('express').Router()

// GET /api/competitors — inteligencia competitiva (A5)
router.get('/', (req, res) => {
  res.json({ message: 'Espía competitivo — próximamente Fase 4', competidores: [] })
})

module.exports = router
