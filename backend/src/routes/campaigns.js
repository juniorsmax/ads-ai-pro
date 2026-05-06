const router = require('express').Router()

// GET /api/campaigns — lista de campañas
router.get('/', (req, res) => {
  res.json({ message: 'Campañas — próximamente Fase 1', campanas: [] })
})

module.exports = router
