const router = require('express').Router()
const auth   = require('../middleware/auth')
const cache  = require('../services/cache')
const hostinger = require('../services/hostinger')

const TTL_METRICS = 60          // métricas en tiempo real — 60s
const TTL_STATIC  = 60 * 10    // datos estáticos del VPS — 10min

// ── GET /api/hostinger/vps ───────────────────────────────────────────────────
// Lista VPS vinculados a la cuenta Hostinger
router.get('/vps', auth, async (req, res) => {
  const key = `hostinger_vps_list:${req.user.userId}`
  try {
    let data = await cache.get(key)
    if (!data) {
      data = await hostinger.listVPS()
      await cache.set(key, data, TTL_STATIC)
    }
    res.json(data)
  } catch (err) {
    console.error('[Hostinger /vps]', err.message)
    res.status(err.status ?? 502).json({ error: err.message })
  }
})

// ── GET /api/hostinger/vps/:id ───────────────────────────────────────────────
// Detalle completo: estado, IP, plan, disco, RAM
router.get('/vps/:id', auth, async (req, res) => {
  const key = `hostinger_vps:${req.params.id}`
  try {
    let data = await cache.get(key)
    if (!data) {
      data = await hostinger.getVPS(req.params.id)
      await cache.set(key, data, TTL_STATIC)
    }
    res.json(data)
  } catch (err) {
    console.error('[Hostinger /vps/:id]', err.message)
    res.status(err.status ?? 502).json({ error: err.message })
  }
})

// ── GET /api/hostinger/vps/:id/metrics ──────────────────────────────────────
// CPU %, RAM %, red IN/OUT, disco % — refresco cada 60s
router.get('/vps/:id/metrics', auth, async (req, res) => {
  const key = `hostinger_metrics:${req.params.id}`
  try {
    let data = await cache.get(key)
    if (!data) {
      data = await hostinger.getMetrics(req.params.id)
      await cache.set(key, data, TTL_METRICS)
    }
    res.json(data)
  } catch (err) {
    console.error('[Hostinger /metrics]', err.message)
    res.status(err.status ?? 502).json({ error: err.message })
  }
})

// ── GET /api/hostinger/vps/:id/metrics/history?period=day ───────────────────
// Historial para gráficas de tendencia
router.get('/vps/:id/metrics/history', auth, async (req, res) => {
  const { period = 'day' } = req.query
  const key = `hostinger_history:${req.params.id}:${period}`
  try {
    let data = await cache.get(key)
    if (!data) {
      data = await hostinger.getMetricsHistory(req.params.id, period)
      await cache.set(key, data, TTL_METRICS * 5)
    }
    res.json(data)
  } catch (err) {
    console.error('[Hostinger /history]', err.message)
    res.status(err.status ?? 502).json({ error: err.message })
  }
})

module.exports = router
