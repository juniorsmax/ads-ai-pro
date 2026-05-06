const router = require('express').Router()

// POST /api/auth/google — inicia OAuth con Google
router.post('/google', (req, res) => {
  // TODO: implementar OAuth flow en Fase 1
  res.json({ message: 'OAuth Google — próximamente Fase 1' })
})

// POST /api/auth/callback — callback de Google OAuth
router.get('/callback', (req, res) => {
  // TODO: intercambiar código por token y crear sesión
  res.json({ message: 'Callback OAuth — próximamente Fase 1' })
})

module.exports = router
