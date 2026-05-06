const { PLANES } = require('../services/stripe')
const supabase = require('../services/supabase')

// Middleware que inyecta el plan del usuario en req.plan
async function injectPlan(req, res, next) {
  if (!req.user?.userId) return next()
  const { data } = await supabase
    .from('usuarios')
    .select('plan')
    .eq('id', req.user.userId)
    .single()
  req.plan = PLANES[data?.plan ?? 'basico'] ?? PLANES.basico
  next()
}

// Verifica que el usuario no supere el límite de cuentas de su plan
async function checkCuentasLimit(req, res, next) {
  if (!req.plan) return next()
  const { count } = await supabase
    .from('cuentas_vinculadas')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', req.user.userId)
    .eq('activa', true)

  if (count >= req.plan.cuentasMax) {
    return res.status(403).json({
      error: `Tu plan ${req.plan.nombre} permite máximo ${req.plan.cuentasMax} cuenta(s). Actualiza tu plan para añadir más.`,
      limiteCuentas: req.plan.cuentasMax,
    })
  }
  next()
}

// Verifica que el feature existe en el plan
function requireFeature(feature) {
  return (req, res, next) => {
    if (!req.plan) return next()
    if (!req.plan[feature]) {
      return res.status(403).json({
        error: `Esta función no está disponible en tu plan ${req.plan.nombre}. Actualiza para acceder.`,
        feature,
      })
    }
    next()
  }
}

module.exports = { injectPlan, checkCuentasLimit, requireFeature }
