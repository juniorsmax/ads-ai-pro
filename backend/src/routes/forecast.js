const router = require('express').Router()
const auth = require('../middleware/auth')
const supabase = require('../services/supabase')
const cache = require('../services/cache')
const forecaster = require('../agents/forecaster')
const { registrarUso } = require('../services/tokenTracker')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── GET /api/forecast/:cuentaId ───────────────────────────────────────────────
router.get('/:cuentaId', auth, async (req, res) => {
  const { cuentaId } = req.params
  if (!UUID_RE.test(cuentaId)) return res.status(400).json({ error: 'cuentaId inválido' })

  const { data: cuenta } = await supabase
    .from('cuentas_vinculadas')
    .select('id')
    .eq('id', cuentaId)
    .eq('usuario_id', req.user.userId)
    .single()

  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' })

  const cacheKey = `forecast:${cuentaId}`
  const cached = await cache.get(cacheKey)
  if (cached) return res.json({ ...cached, fromCache: true })

  const accountSummary = await cache.get(`account_summary:${cuentaId}`)
  if (!accountSummary) return res.status(400).json({ error: 'Sincroniza la cuenta primero' })

  try {
    const { data, usage, model } = await forecaster.predict(accountSummary, cuentaId)
    await cache.set(cacheKey, data, 'CAMPAIGN_LIST')

    if (usage) {
      registrarUso(req.user.userId, 'forecaster', model, usage).catch(() => {})
    }

    res.json({ ...data, fromCache: false })
  } catch (err) {
    console.error('[Forecast]', err.message)
    res.status(500).json({ error: 'Error generando predicciones' })
  }
})

module.exports = router
