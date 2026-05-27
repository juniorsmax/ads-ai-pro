const router = require('express').Router()
const auth = require('../middleware/auth')
const supabase = require('../services/supabase')
const cache = require('../services/cache')
const automationEngine = require('../services/automationEngine')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function checkOwnershipAndPlan(req, res, cuentaId, checkPlan = false) {
  if (!UUID_RE.test(cuentaId)) {
    res.status(400).json({ error: 'cuentaId inválido' })
    return null
  }

  const queries = [
    supabase.from('cuentas_vinculadas').select('id').eq('id', cuentaId).eq('usuario_id', req.user.userId).single(),
  ]

  if (checkPlan) {
    queries.push(
      supabase.from('usuarios').select('plan').eq('id', req.user.userId).single()
    )
  }

  const results = await Promise.all(queries)
  const { data: cuenta } = results[0]

  if (!cuenta) {
    res.status(404).json({ error: 'Cuenta no encontrada' })
    return null
  }

  if (checkPlan) {
    const { data: usuario } = results[1]
    const plan = usuario?.plan ?? 'basico'
    if (plan === 'basico') {
      res.status(403).json({ error: 'plan_insuficiente', message: 'Requiere plan Profesional o Agencia' })
      return null
    }
  }

  return true
}

// ── GET /api/automation/:cuentaId/preview ─────────────────────────────────────
router.get('/:cuentaId/preview', auth, async (req, res) => {
  const { cuentaId } = req.params
  const ok = await checkOwnershipAndPlan(req, res, cuentaId, true)
  if (!ok) return

  const accountSummary = await cache.get(`account_summary:${cuentaId}`)
  if (!accountSummary) return res.status(400).json({ error: 'Sincroniza la cuenta primero' })

  try {
    const { acciones, total } = await automationEngine.run(cuentaId, req.user.userId, accountSummary, { dryRun: true })
    res.json({ acciones, total })
  } catch (err) {
    console.error('[Automation preview]', err.message)
    res.status(500).json({ error: 'Error generando vista previa' })
  }
})

// ── POST /api/automation/:cuentaId/execute ────────────────────────────────────
router.post('/:cuentaId/execute', auth, async (req, res) => {
  const { cuentaId } = req.params
  const ok = await checkOwnershipAndPlan(req, res, cuentaId, true)
  if (!ok) return

  const accountSummary = await cache.get(`account_summary:${cuentaId}`)
  if (!accountSummary) return res.status(400).json({ error: 'Sincroniza la cuenta primero' })

  try {
    const { acciones, total } = await automationEngine.run(cuentaId, req.user.userId, accountSummary, { dryRun: false })
    res.json({ ejecutadas: total, acciones })
  } catch (err) {
    console.error('[Automation execute]', err.message)
    res.status(500).json({ error: 'Error ejecutando acciones' })
  }
})

// ── GET /api/automation/:cuentaId/log ─────────────────────────────────────────
router.get('/:cuentaId/log', auth, async (req, res) => {
  const { cuentaId } = req.params
  const ok = await checkOwnershipAndPlan(req, res, cuentaId, false)
  if (!ok) return

  const page = parseInt(req.query.page ?? '0', 10) || 0
  const limit = 20
  const offset = page * limit

  try {
    const { data, count, error } = await supabase
      .from('automation_log')
      .select('*', { count: 'exact' })
      .eq('cuenta_id', cuentaId)
      .order('creado_en', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({ log: data ?? [], total: count ?? 0 })
  } catch (err) {
    console.error('[Automation log]', err.message)
    res.status(500).json({ error: 'Error obteniendo historial' })
  }
})

module.exports = router
