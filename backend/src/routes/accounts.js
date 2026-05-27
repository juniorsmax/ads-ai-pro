const router = require('express').Router()
const auth = require('../middleware/auth')
const supabase = require('../services/supabase')
const googleAds = require('../services/googleAds')
const cache = require('../services/cache')
const { compressAccountData } = require('../utils/dataCompressor')
const { linkAccount } = require('../middleware/validators')
const { decrypt } = require('../services/tokenCrypto')

// GET /api/accounts — listar cuentas vinculadas del usuario
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('cuentas_vinculadas')
    .select('id, customer_id, nombre, moneda, zona_horaria, activa')
    .eq('usuario_id', req.user.userId)

  if (error) return res.status(500).json({ error: 'Error obteniendo cuentas' })
  res.json(data)
})

// GET /api/accounts/accessible — cuentas de Google Ads accesibles
router.get('/accessible', auth, async (req, res) => {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('google_refresh_token')
    .eq('id', req.user.userId)
    .single()

  const refreshToken = decrypt(usuario?.google_refresh_token)
  if (!refreshToken) {
    return res.status(400).json({ error: 'No hay token de Google. Conecta tu cuenta primero.' })
  }

  try {
    const cuentas = await googleAds.getAccessibleAccounts(refreshToken)
    res.json(cuentas)
  } catch (err) {
    console.error('[Accounts accessible]', err.message)
    res.status(500).json({ error: 'Error obteniendo cuentas de Google Ads' })
  }
})

// POST /api/accounts/link — vincular una cuenta Google Ads
router.post('/link', auth, linkAccount, async (req, res) => {
  const { customerId, nombre } = req.body
  if (!customerId) return res.status(400).json({ error: 'customer_id requerido' })

  const { data, error } = await supabase
    .from('cuentas_vinculadas')
    .upsert({
      usuario_id: req.user.userId,
      customer_id: customerId,
      nombre: nombre ?? `Cuenta ${customerId}`,
      activa: true,
    }, { onConflict: 'usuario_id,customer_id' })
    .select()
    .single()

  if (error) return res.status(500).json({ error: 'Error vinculando cuenta' })
  res.json(data)
})

// GET /api/accounts/:id/summary — resumen comprimido de cuenta (con caché)
router.get('/:id/summary', auth, async (req, res) => {
  const cuentaId = req.params.id
  const cacheKey = `account_summary:${cuentaId}`

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
    const raw = await googleAds.getAccountSummary(decrypt(usuario.google_refresh_token), cuenta.customer_id)
    const summary = compressAccountData(raw)
    await cache.set(cacheKey, summary, 'ACCOUNT_SUMMARY')
    res.json(summary)
  } catch (err) {
    console.error('[Account summary]', err.message)
    res.status(500).json({ error: 'Error obteniendo datos de Google Ads' })
  }
})

module.exports = router
