const router = require('express').Router()
const auth = require('../middleware/auth')
const supabase = require('../services/supabase')

// POST /api/settings/whitelabel — guardar configuración de marca
router.post('/whitelabel', auth, async (req, res) => {
  const { nombre, logo_url, color_primario, dominio_personalizado } = req.body

  const { error } = await supabase.from('perfiles_agencia').upsert({
    usuario_id: req.user.userId,
    nombre: nombre?.trim() || 'Mi Agencia',
    logo_url: logo_url?.trim() || null,
    color_primario: color_primario || '#1B3A6B',
    dominio_personalizado: dominio_personalizado?.trim() || null,
    actualizado_en: new Date().toISOString(),
  }, { onConflict: 'usuario_id' })

  if (error) {
    console.error('[Settings whitelabel]', error.message)
    return res.status(500).json({ error: 'Error guardando configuración' })
  }

  res.json({ ok: true })
})

// GET /api/settings/whitelabel — obtener configuración de marca
router.get('/whitelabel', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('perfiles_agencia')
    .select('nombre, logo_url, color_primario, dominio_personalizado')
    .eq('usuario_id', req.user.userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message })
  }

  res.json(data ?? {})
})

module.exports = router
