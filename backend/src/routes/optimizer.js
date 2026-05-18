const router = require('express').Router()
const auth = require('../middleware/auth')
const supabase = require('../services/supabase')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── GET /api/optimizer/pendientes/:cuentaId ───────────────────────────────────
router.get('/pendientes/:cuentaId', auth, async (req, res) => {
  const { cuentaId } = req.params
  if (!UUID_RE.test(cuentaId)) return res.status(400).json({ error: 'cuentaId inválido' })

  const { data: cuenta } = await supabase
    .from('cuentas_vinculadas').select('id').eq('id', cuentaId).eq('usuario_id', req.user.userId).single()
  if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' })

  const { data, error } = await supabase
    .from('aprobaciones')
    .select('*')
    .eq('cuenta_id', cuentaId)
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: false })

  if (error) return res.status(500).json({ error: 'Error obteniendo cambios pendientes' })
  res.json({ pendientes: data ?? [] })
})

// ── POST /api/optimizer/aprobar/:id ───────────────────────────────────────────
router.post('/aprobar/:id', auth, async (req, res) => {
  const { id } = req.params
  if (!UUID_RE.test(id)) return res.status(400).json({ error: 'id inválido' })

  const { error } = await supabase
    .from('aprobaciones')
    .update({ estado: 'aprobado', actualizado_en: new Date().toISOString() })
    .eq('id', id)
    .eq('usuario_id', req.user.userId)

  if (error) return res.status(500).json({ error: 'No se pudo aprobar el cambio' })
  res.json({ ok: true })
})

// ── POST /api/optimizer/rechazar/:id ──────────────────────────────────────────
router.post('/rechazar/:id', auth, async (req, res) => {
  const { id } = req.params
  if (!UUID_RE.test(id)) return res.status(400).json({ error: 'id inválido' })

  const { error } = await supabase
    .from('aprobaciones')
    .update({ estado: 'rechazado', actualizado_en: new Date().toISOString() })
    .eq('id', id)
    .eq('usuario_id', req.user.userId)

  if (error) return res.status(500).json({ error: 'No se pudo rechazar el cambio' })
  res.json({ ok: true })
})

module.exports = router
