const router = require('express').Router()
const auth = require('../middleware/auth')
const { checkCircuitBreaker } = require('../middleware/planLimiter')
const { analyzeCompetitors, getAuctionInsights } = require('../agents/competitorSpy')
const supabase = require('../services/supabase')
const cache = require('../services/cache')
const { decrypt } = require('../services/tokenCrypto')

// GET /api/competitors/:cuentaId — obtener análisis competitivo (con caché 24h)
router.get('/:cuentaId', auth, checkCircuitBreaker, async (req, res) => {
  const { cuentaId } = req.params
  const cacheKey = `competitors:${cuentaId}`

  const cached = await cache.get(cacheKey)
  if (cached) return res.json({ ...cached, fromCache: true })

  const { data: cuenta } = await supabase
    .from('cuentas_vinculadas')
    .select('customer_id')
    .eq('id', cuentaId)
    .eq('usuario_id', req.user.userId)
    .single()

  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('google_refresh_token')
    .eq('id', req.user.userId)
    .single()

  try {
    const auctionInsights = await getAuctionInsights(decrypt(usuario.google_refresh_token), cuenta.customer_id)
    const analisis = await analyzeCompetitors(auctionInsights, cuenta.customer_id)

    await cache.set(cacheKey, analisis, 'COMPETITOR_DATA')
    res.json(analisis)
  } catch (err) {
    console.error('[Competitors]', err.message)
    res.status(500).json({ error: 'Error obteniendo datos de competidores' })
  }
})

// POST /api/competitors/:cuentaId/refresh — forzar refresco sin caché
router.post('/:cuentaId/refresh', auth, async (req, res) => {
  const { cuentaId } = req.params
  const { data: cuenta } = await supabase
    .from('cuentas_vinculadas')
    .select('id')
    .eq('id', cuentaId)
    .eq('usuario_id', req.user.userId)
    .single()
  if (!cuenta) return res.status(403).json({ error: 'Cuenta no encontrada' })
  await cache.del(`competitors:${cuentaId}`)
  res.json({ ok: true, mensaje: 'Caché invalidada. Recarga la página para obtener datos frescos.' })
})

module.exports = router
