const router = require('express').Router()

// POST /api/accounts/link — vincular cuenta Google Ads
router.post('/link', (req, res) => {
  res.json({ message: 'Vincular cuenta — próximamente Fase 1' })
})

// GET /api/accounts/:id/summary — resumen comprimido de cuenta
router.get('/:id/summary', (req, res) => {
  res.json({ message: 'Resumen de cuenta — próximamente Fase 1', id: req.params.id })
})

module.exports = router
