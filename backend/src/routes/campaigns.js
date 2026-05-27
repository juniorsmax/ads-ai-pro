const router = require('express').Router()
const auth = require('../middleware/auth')
const googleAds = require('../services/googleAds')
const supabase = require('../services/supabase')
const cache = require('../services/cache')
const { decrypt } = require('../services/tokenCrypto')

async function getCuentaYToken(cuentaId, usuarioId) {
  const [{ data: cuenta }, { data: usuario }] = await Promise.all([
    supabase.from('cuentas_vinculadas').select('customer_id').eq('id', cuentaId).eq('usuario_id', usuarioId).single(),
    supabase.from('usuarios').select('google_refresh_token').eq('id', usuarioId).single(),
  ])
  return { cuenta, refreshToken: decrypt(usuario?.google_refresh_token) }
}

// GET /api/campaigns/:cuentaId — lista de campañas con métricas 30 días
router.get('/:cuentaId', auth, async (req, res) => {
  const { cuentaId } = req.params
  const cacheKey = `campaigns:${cuentaId}`

  const cached = await cache.get(cacheKey)
  if (cached) return res.json({ campanas: cached, fromCache: true })

  const { cuenta, refreshToken } = await getCuentaYToken(cuentaId, req.user.userId)
  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' })

  try {
    const summary = await googleAds.getAccountSummary(refreshToken, cuenta.customer_id)
    await cache.set(cacheKey, summary.campaigns, 'CAMPAIGN_LIST')
    res.json({ campanas: summary.campaigns, fromCache: false })
  } catch (err) {
    console.error('[Campaigns]', err.message)
    res.status(500).json({ error: 'Error obteniendo campañas de Google Ads' })
  }
})

// GET /api/campaigns/:cuentaId/daily — métricas diarias para el gráfico
router.get('/:cuentaId/daily', auth, async (req, res) => {
  const { cuentaId } = req.params
  const cacheKey = `daily:${cuentaId}`

  const cached = await cache.get(cacheKey)
  if (cached) return res.json({ datos: cached, fromCache: true })

  const { cuenta, refreshToken } = await getCuentaYToken(cuentaId, req.user.userId)
  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' })

  try {
    const datos = await googleAds.getDailyMetrics(refreshToken, cuenta.customer_id)
    await cache.set(cacheKey, datos, 'CAMPAIGN_LIST')
    res.json({ datos, fromCache: false })
  } catch (err) {
    console.error('[Daily metrics]', err.message)
    res.status(500).json({ error: 'Error obteniendo métricas diarias' })
  }
})

module.exports = router
