const router = require('express').Router()
const auth = require('../middleware/auth')
const supabase = require('../services/supabase')

// POST /api/feedback — enviar feedback (requiere auth)
router.post('/', auth, async (req, res) => {
  const { tipo, mensaje, nps, pagina, metadata } = req.body

  if (!tipo || !mensaje?.trim()) {
    return res.status(400).json({ error: 'tipo y mensaje son requeridos' })
  }

  const tiposValidos = ['bug', 'sugerencia', 'comentario']
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: 'tipo debe ser bug, sugerencia o comentario' })
  }

  const { error } = await supabase.from('feedback').insert({
    usuario_id: req.user.userId,
    tipo,
    mensaje: mensaje.trim(),
    nps: nps != null ? Number(nps) : null,
    pagina: pagina ?? null,
    metadata: metadata ?? {},
  })

  if (error) {
    console.error('[Feedback]', error.message)
    return res.status(500).json({ error: 'Error guardando feedback' })
  }

  res.status(201).json({ ok: true })
})

// GET /api/feedback — listar feedback (solo admin)
router.get('/', auth, async (req, res) => {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('email')
    .eq('id', req.user.userId)
    .single()

  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())
  if (!admins.includes(usuario?.email)) {
    return res.status(403).json({ error: 'Acceso denegado' })
  }

  const { tipo, desde, hasta } = req.query
  let query = supabase
    .from('feedback')
    .select('*, usuarios(email, nombre, plan)')
    .order('creado_en', { ascending: false })
    .limit(200)

  if (tipo) query = query.eq('tipo', tipo)
  if (desde) query = query.gte('creado_en', desde)
  if (hasta) query = query.lte('creado_en', hasta)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  res.json(data)
})

module.exports = router
