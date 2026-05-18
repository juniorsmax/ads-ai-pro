const router = require('express').Router()
const auth = require('../middleware/auth')
const { getConfig, saveConfig, getEstadoTodas, sendTelegram, sendDiscord } = require('../services/integraciones')
const { validarURLPublica } = require('../utils/urlSafe')

// ── GET /api/integraciones ────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const estado = await getEstadoTodas(req.user.userId)
    res.json({ estado })
  } catch (err) {
    console.error('[Integraciones get]', err.message)
    res.status(500).json({ error: 'Error obteniendo integraciones' })
  }
})

// ── POST /api/integraciones/telegram ─────────────────────────────────────────
router.post('/telegram', auth, async (req, res) => {
  const { botToken, chatId } = req.body
  if (!botToken?.trim() || !chatId?.trim()) {
    return res.status(400).json({ error: 'botToken y chatId son obligatorios' })
  }
  // botToken formato: 123456789:AABBCCDDEEFFaabbccddeeff-xxxx
  if (!/^\d{8,12}:[A-Za-z0-9_-]{35,}$/.test(botToken)) {
    return res.status(400).json({ error: 'botToken con formato inválido' })
  }
  // chatId: número (puede ser negativo para grupos)
  if (!/^-?\d{1,20}$/.test(chatId)) {
    return res.status(400).json({ error: 'chatId debe ser un número válido' })
  }
  try {
    await saveConfig(req.user.userId, 'telegram', { botToken, chatId })
    res.json({ ok: true })
  } catch (err) {
    console.error('[Telegram save]', err.message)
    res.status(500).json({ error: 'Error guardando configuración de Telegram' })
  }
})

// ── POST /api/integraciones/telegram/test ────────────────────────────────────
router.post('/telegram/test', auth, async (req, res) => {
  const config = await getConfig(req.user.userId, 'telegram')
  if (!config?.botToken || !config?.chatId) {
    return res.status(400).json({ error: 'Configura Telegram antes de hacer el test' })
  }
  try {
    await sendTelegram(config.botToken, config.chatId,
      '✅ <b>ADSAI PRO</b>\n\nConexión con Telegram verificada correctamente.')
    res.json({ ok: true })
  } catch (err) {
    console.error('[Telegram test]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/integraciones/discord ──────────────────────────────────────────
router.post('/discord', auth, async (req, res) => {
  const { webhookUrl } = req.body
  if (!webhookUrl?.trim()) return res.status(400).json({ error: 'webhookUrl es obligatoria' })

  // Validar que sea una URL pública y de Discord
  if (!webhookUrl.startsWith('https://discord.com/api/webhooks/') &&
      !webhookUrl.startsWith('https://discordapp.com/api/webhooks/')) {
    return res.status(400).json({ error: 'webhookUrl debe ser una URL de webhook de Discord válida' })
  }
  try {
    await validarURLPublica(webhookUrl)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  try {
    await saveConfig(req.user.userId, 'discord', { webhookUrl })
    res.json({ ok: true })
  } catch (err) {
    console.error('[Discord save]', err.message)
    res.status(500).json({ error: 'Error guardando configuración de Discord' })
  }
})

// ── POST /api/integraciones/discord/test ─────────────────────────────────────
router.post('/discord/test', auth, async (req, res) => {
  const config = await getConfig(req.user.userId, 'discord')
  if (!config?.webhookUrl) return res.status(400).json({ error: 'Configura Discord antes de hacer el test' })
  try {
    await sendDiscord(config.webhookUrl, '✅ **ADSAI PRO** — Conexión con Discord verificada correctamente.')
    res.json({ ok: true })
  } catch (err) {
    console.error('[Discord test]', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── OAuth stubs (próximamente) ────────────────────────────────────────────────
for (const svc of ['gsc', 'ga4', 'merchant', 'gmb']) {
  router.get(`/${svc}/auth`, auth, (_req, res) =>
    res.status(501).json({ error: `Integración con ${svc.toUpperCase()} próximamente disponible` })
  )
}

module.exports = router
