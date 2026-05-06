const router = require('express').Router()
const supabase = require('../services/supabase')

// POST /api/waitlist — apuntarse a la lista de espera (público, sin auth)
router.post('/', async (req, res) => {
  const { email, nombre, tipo } = req.body

  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' })
  }

  const tiposValidos = ['autonomo', 'empresa', 'agencia', 'otro']
  const tipoFinal = tiposValidos.includes(tipo) ? tipo : 'otro'

  const { error } = await supabase.from('waitlist').insert({
    email: email.trim().toLowerCase(),
    nombre: nombre?.trim() || null,
    tipo: tipoFinal,
    fuente: req.headers.referer?.includes('producthunt') ? 'producthunt' : 'organico',
    ip: req.ip,
  })

  // Email duplicado — responder ok igualmente para no filtrar existencia
  if (error?.code === '23505') return res.status(201).json({ ok: true, posicion: null })
  if (error) {
    console.error('[Waitlist]', error.message)
    return res.status(500).json({ error: 'Error guardando registro' })
  }

  // Devolver posición en la lista
  const { count } = await supabase.from('waitlist').select('*', { count: 'exact', head: true })
  res.status(201).json({ ok: true, posicion: count })
})

// GET /api/waitlist/count — total de registros (público)
router.get('/count', async (req, res) => {
  const { count, error } = await supabase.from('waitlist').select('*', { count: 'exact', head: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ total: count })
})

module.exports = router
