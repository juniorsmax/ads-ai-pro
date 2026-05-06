const router = require('express').Router()
const auth = require('../middleware/auth')
const googleAds = require('../services/googleAds')
const supabase = require('../services/supabase')
const cache = require('../services/cache')

// GET /api/keywords/:cuentaId — keywords con bajo rendimiento o alto CPA
router.get('/:cuentaId', auth, async (req, res) => {
  const { cuentaId } = req.params
  const cacheKey = `keywords:${cuentaId}`

  const cached = await cache.get(cacheKey)
  if (cached) return res.json({ keywords: cached, fromCache: true })

  const [{ data: cuenta }, { data: usuario }] = await Promise.all([
    supabase.from('cuentas_vinculadas').select('customer_id').eq('id', cuentaId).eq('usuario_id', req.user.userId).single(),
    supabase.from('usuarios').select('google_refresh_token').eq('id', req.user.userId).single(),
  ])

  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' })

  try {
    const keywords = await googleAds.getProblemKeywords(usuario.google_refresh_token, cuenta.customer_id)
    await cache.set(cacheKey, keywords, 'CAMPAIGN_LIST')
    res.json({ keywords, fromCache: false })
  } catch (err) {
    console.error('[Keywords]', err.message)
    res.status(500).json({ error: 'Error obteniendo keywords de Google Ads' })
  }
})

module.exports = router
