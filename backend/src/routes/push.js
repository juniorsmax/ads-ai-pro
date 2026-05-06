const router = require('express').Router()
const auth = require('../middleware/auth')
const push = require('../services/pushNotifications')

// GET /api/push/vapid-public-key — clave pública VAPID para el frontend
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
})

// POST /api/push/subscribe — registrar suscripción push
router.post('/subscribe', auth, async (req, res) => {
  const { subscription } = req.body
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Suscripción inválida' })

  try {
    await push.subscribe(req.user.userId, subscription)
    res.json({ ok: true })
  } catch (err) {
    console.error('[Push subscribe]', err.message)
    res.status(500).json({ error: 'Error registrando suscripción' })
  }
})

// POST /api/push/unsubscribe — cancelar suscripción
router.post('/unsubscribe', auth, async (req, res) => {
  const { endpoint } = req.body
  if (!endpoint) return res.status(400).json({ error: 'endpoint requerido' })
  await push.unsubscribe(endpoint)
  res.json({ ok: true })
})

// POST /api/push/test — enviar notificación de prueba (solo dev)
router.post('/test', auth, async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Solo disponible en desarrollo' })
  await push.sendToUser(req.user.userId, {
    title: 'ADSAI PRO — Prueba',
    body: 'Las notificaciones push están funcionando correctamente.',
  })
  res.json({ ok: true })
})

module.exports = router
