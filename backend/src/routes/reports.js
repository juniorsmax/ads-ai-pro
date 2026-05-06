const router = require('express').Router()

// POST /api/reports/generate — generar reporte white-label (A6)
router.post('/generate', (req, res) => {
  res.json({ message: 'Generador de reportes — próximamente Fase 3' })
})

module.exports = router
