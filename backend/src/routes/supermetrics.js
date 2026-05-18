const router = require('express').Router()
const auth   = require('../middleware/auth')
const cache  = require('../services/cache')
const supermetrics = require('../services/supermetrics')

const TTL = 60 * 30  // 30 min — datos de plataformas externas cambian poco en ventanas cortas

// ── POST /api/supermetrics/google-ads ────────────────────────────────────────
router.post('/google-ads', auth, async (req, res) => {
  const { accountId, dateRange, fields } = req.body
  if (!accountId) return res.status(400).json({ error: 'accountId requerido' })

  const key = `sm_google_ads:${accountId}:${dateRange ?? 'last_30_days'}`
  try {
    let data = await cache.get(key)
    if (!data) {
      data = await supermetrics.getGoogleAds({ accountId, dateRange, fields })
      await cache.set(key, data, TTL)
    }
    res.json(data)
  } catch (err) {
    console.error('[Supermetrics /google-ads]', err.message)
    res.status(err.status ?? 502).json({ error: err.message })
  }
})

// ── POST /api/supermetrics/facebook-ads ──────────────────────────────────────
router.post('/facebook-ads', auth, async (req, res) => {
  const { accountId, dateRange, fields } = req.body
  if (!accountId) return res.status(400).json({ error: 'accountId requerido' })

  const key = `sm_facebook_ads:${accountId}:${dateRange ?? 'last_30_days'}`
  try {
    let data = await cache.get(key)
    if (!data) {
      data = await supermetrics.getFacebookAds({ accountId, dateRange, fields })
      await cache.set(key, data, TTL)
    }
    res.json(data)
  } catch (err) {
    console.error('[Supermetrics /facebook-ads]', err.message)
    res.status(err.status ?? 502).json({ error: err.message })
  }
})

// ── POST /api/supermetrics/ga4 ───────────────────────────────────────────────
router.post('/ga4', auth, async (req, res) => {
  const { propertyId, dateRange } = req.body
  if (!propertyId) return res.status(400).json({ error: 'propertyId requerido' })

  const key = `sm_ga4:${propertyId}:${dateRange ?? 'last_30_days'}`
  try {
    let data = await cache.get(key)
    if (!data) {
      data = await supermetrics.getGA4({ propertyId, dateRange })
      await cache.set(key, data, TTL)
    }
    res.json(data)
  } catch (err) {
    console.error('[Supermetrics /ga4]', err.message)
    res.status(err.status ?? 502).json({ error: err.message })
  }
})

// ── POST /api/supermetrics/multiplatform ─────────────────────────────────────
// Vista unificada: todas las plataformas de una vez
// Body: { accounts: { googleAds, facebookAds, ga4, linkedinAds }, dateRange }
router.post('/multiplatform', auth, async (req, res) => {
  const { accounts, dateRange } = req.body
  if (!accounts || Object.keys(accounts).length === 0) {
    return res.status(400).json({ error: 'accounts requerido (al menos una plataforma)' })
  }

  const key = `sm_multi:${req.user.userId}:${JSON.stringify(accounts)}:${dateRange ?? 'last_30_days'}`
  try {
    let data = await cache.get(key)
    if (!data) {
      data = await supermetrics.getMultiPlatformSummary({ accounts, dateRange })
      await cache.set(key, data, TTL)
    }
    res.json(data)
  } catch (err) {
    console.error('[Supermetrics /multiplatform]', err.message)
    res.status(err.status ?? 502).json({ error: err.message })
  }
})

module.exports = router
