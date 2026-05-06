const router = require('express').Router()
const auth = require('../middleware/auth')
const { injectPlan, requireFeature } = require('../middleware/planCheck')
const { generateReport, renderHTML } = require('../agents/reportGenerator')
const supabase = require('../services/supabase')
const cache = require('../services/cache')

// POST /api/reports/generate — genera reporte white-label
router.post('/generate', auth, injectPlan, async (req, res) => {
  const { cuentaId, periodo = 'Últimos 30 días' } = req.body
  if (!cuentaId) return res.status(400).json({ error: 'cuentaId requerido' })

  const accountSummary = await cache.get(`account_summary:${cuentaId}`)
  if (!accountSummary) {
    return res.status(400).json({ error: 'Sincroniza la cuenta primero' })
  }

  // Obtener perfil de agencia (white-label)
  const { data: perfil } = await supabase
    .from('perfiles_agencia')
    .select('*')
    .eq('usuario_id', req.user.userId)
    .single()

  try {
    const reporte = await generateReport({
      accountSummary,
      perfilAgencia: perfil ?? { nombre: 'ADSAI PRO' },
      periodo,
    })

    // Guardar en DB
    const { data: reporteGuardado } = await supabase
      .from('reportes')
      .insert({
        cuenta_id: cuentaId,
        usuario_id: req.user.userId,
        tipo: 'mensual',
        contenido: reporte,
      })
      .select()
      .single()

    res.json({ reporteId: reporteGuardado?.id, reporte })
  } catch (err) {
    console.error('[Reports generate]', err.message)
    res.status(500).json({ error: 'Error generando el reporte' })
  }
})

// GET /api/reports/:id/html — reporte renderizado como HTML (para preview o impresión)
router.get('/:id/html', auth, async (req, res) => {
  const { data: reporte } = await supabase
    .from('reportes')
    .select('contenido, usuario_id')
    .eq('id', req.params.id)
    .single()

  if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' })
  if (reporte.usuario_id !== req.user.userId) return res.status(403).json({ error: 'Sin acceso' })

  const html = renderHTML(reporte.contenido)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

// GET /api/reports — listar reportes del usuario
router.get('/', auth, async (req, res) => {
  const { data } = await supabase
    .from('reportes')
    .select('id, tipo, creado_en, cuenta_id, cuentas_vinculadas(nombre)')
    .eq('usuario_id', req.user.userId)
    .order('creado_en', { ascending: false })
    .limit(20)

  res.json(data ?? [])
})

// GET /api/reports/portal/:token — acceso público al reporte (portal cliente)
router.get('/portal/:token', async (req, res) => {
  const { data: acceso } = await supabase
    .from('portal_tokens')
    .select('reporte_id, expira_en')
    .eq('token', req.params.token)
    .single()

  if (!acceso) return res.status(404).send('<h1>Enlace no válido</h1>')
  if (new Date(acceso.expira_en) < new Date()) return res.status(410).send('<h1>Este enlace ha expirado</h1>')

  const { data: reporte } = await supabase
    .from('reportes')
    .select('contenido')
    .eq('id', acceso.reporte_id)
    .single()

  if (!reporte) return res.status(404).send('<h1>Reporte no encontrado</h1>')

  const html = renderHTML(reporte.contenido)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

module.exports = router
