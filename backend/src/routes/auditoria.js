const router = require('express').Router()
const auth = require('../middleware/auth')
const googleAds = require('../services/googleAds')
const ngramas = require('../services/ngramas')
const pagespeed = require('../services/pagespeed')
const healthScorer = require('../agents/healthScorer')
const supabase = require('../services/supabase')
const cache = require('../services/cache')
const { validarURLPublica } = require('../utils/urlSafe')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getCuentaYUsuario(cuentaId, userId) {
  const [{ data: cuenta }, { data: usuario }] = await Promise.all([
    supabase.from('cuentas_vinculadas').select('customer_id').eq('id', cuentaId).eq('usuario_id', userId).single(),
    supabase.from('usuarios').select('google_refresh_token').eq('id', userId).single(),
  ])
  return { cuenta, usuario }
}

// ── GET /api/auditoria/pacing/:cuentaId ──────────────────────────────────────
router.get('/pacing/:cuentaId', auth, async (req, res) => {
  const { cuentaId } = req.params
  if (!UUID_RE.test(cuentaId)) return res.status(400).json({ error: 'cuentaId inválido' })
  const cacheKey = `pacing:${cuentaId}`

  const cached = await cache.get(cacheKey)
  if (cached) return res.json({ ...cached, fromCache: true })

  const { cuenta, usuario } = await getCuentaYUsuario(cuentaId, req.user.userId)
  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' })

  try {
    const data = await googleAds.getCampaignsBudget(usuario.google_refresh_token, cuenta.customer_id)
    await cache.set(cacheKey, data, 'CAMPAIGN_LIST')
    res.json({ ...data, fromCache: false })
  } catch (err) {
    console.error('[Pacing]', err.message)
    res.status(500).json({ error: 'Error obteniendo datos de presupuesto' })
  }
})

// ── GET /api/auditoria/qs-historico/:cuentaId ────────────────────────────────
router.get('/qs-historico/:cuentaId', auth, async (req, res) => {
  const { cuentaId } = req.params
  if (!UUID_RE.test(cuentaId)) return res.status(400).json({ error: 'cuentaId inválido' })

  const { data: cuenta } = await supabase
    .from('cuentas_vinculadas').select('id').eq('id', cuentaId).eq('usuario_id', req.user.userId).single()
  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' })

  const { data } = await supabase
    .from('qs_historico')
    .select('keyword_text, quality_score, fecha')
    .eq('cuenta_id', cuentaId)
    .order('fecha', { ascending: false })
    .limit(500)

  res.json({ historico: data ?? [] })
})

// ── GET /api/auditoria/ngramas/:cuentaId ─────────────────────────────────────
router.get('/ngramas/:cuentaId', auth, async (req, res) => {
  const { cuentaId } = req.params
  if (!UUID_RE.test(cuentaId)) return res.status(400).json({ error: 'cuentaId inválido' })
  const cacheKey = `ngramas:${cuentaId}`

  const cached = await cache.get(cacheKey)
  if (cached) return res.json({ ...cached, fromCache: true })

  const { cuenta, usuario } = await getCuentaYUsuario(cuentaId, req.user.userId)
  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' })

  try {
    const searchTerms = await googleAds.getSearchTermsReport(usuario.google_refresh_token, cuenta.customer_id)
    const resultado = ngramas.analizar(searchTerms)
    await cache.set(cacheKey, resultado, 'CAMPAIGN_LIST')
    res.json({ ...resultado, fromCache: false })
  } catch (err) {
    console.error('[Ngramas]', err.message)
    res.status(500).json({ error: 'Error obteniendo términos de búsqueda' })
  }
})

// ── GET /api/auditoria/abtests/:cuentaId ─────────────────────────────────────
router.get('/abtests/:cuentaId', auth, async (req, res) => {
  const { cuentaId } = req.params
  if (!UUID_RE.test(cuentaId)) return res.status(400).json({ error: 'cuentaId inválido' })
  const cacheKey = `abtests:${cuentaId}`

  const cached = await cache.get(cacheKey)
  if (cached) return res.json({ tests: cached, fromCache: true })

  const { cuenta, usuario } = await getCuentaYUsuario(cuentaId, req.user.userId)
  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' })

  try {
    const tests = await googleAds.getAdsPerAdGroup(usuario.google_refresh_token, cuenta.customer_id)
    await cache.set(cacheKey, tests, 'CAMPAIGN_LIST')
    res.json({ tests, fromCache: false })
  } catch (err) {
    console.error('[ABTests]', err.message)
    res.status(500).json({ error: 'Error obteniendo datos de anuncios' })
  }
})

// ── POST /api/auditoria/pagespeed ─────────────────────────────────────────────
router.post('/pagespeed', auth, async (req, res) => {
  const { url } = req.body
  if (!url?.trim()) return res.status(400).json({ error: 'URL requerida' })

  try {
    await validarURLPublica(url)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  const cacheKey = `pagespeed:${Buffer.from(url).toString('base64').slice(0, 64)}`
  const cached = await cache.get(cacheKey)
  if (cached) return res.json({ ...cached, fromCache: true })

  try {
    const resultado = await pagespeed.analyzeUrl(url)
    await cache.set(cacheKey, resultado, 'CAMPAIGN_LIST')
    res.json({ ...resultado, fromCache: false })
  } catch (err) {
    console.error('[PageSpeed]', err.message)
    res.status(500).json({ error: err.message || 'Error al analizar la URL con PageSpeed' })
  }
})

// ── POST /api/auditoria/health-score ─────────────────────────────────────────
router.post('/health-score', auth, async (req, res) => {
  const { cuentaId } = req.body
  if (!cuentaId) return res.status(400).json({ error: 'cuentaId requerido' })
  if (!UUID_RE.test(cuentaId)) return res.status(400).json({ error: 'cuentaId inválido' })

  const cacheKey = `health_score:${cuentaId}`
  const cached = await cache.get(cacheKey)
  if (cached) return res.json({ ...cached, fromCache: true })

  const { cuenta, usuario } = await getCuentaYUsuario(cuentaId, req.user.userId)
  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' })

  try {
    const [summary, keywords] = await Promise.all([
      googleAds.getAccountSummary(usuario.google_refresh_token, cuenta.customer_id),
      googleAds.getProblemKeywords(usuario.google_refresh_token, cuenta.customer_id),
    ])
    const resultado = await healthScorer.analyze(summary, keywords)
    await cache.set(cacheKey, resultado, 'CAMPAIGN_LIST')
    res.json({ ...resultado, fromCache: false })
  } catch (err) {
    console.error('[HealthScore]', err.message)
    res.status(500).json({ error: 'Error calculando el health score' })
  }
})

module.exports = router
