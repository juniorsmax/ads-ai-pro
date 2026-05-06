const supabase = require('../services/supabase')
const { estaIAPausada } = require('../services/tokenTracker')
const { PLANES } = require('../services/stripe')

// Bloquea si el coste diario superó el límite ($5 por defecto)
async function checkCircuitBreaker(req, res, next) {
  if (await estaIAPausada()) {
    return res.status(503).json({
      error: 'Los servicios de IA están temporalmente pausados por coste diario excesivo. Se reactivarán automáticamente a medianoche.',
      codigo: 'IA_PAUSADA',
    })
  }
  next()
}

// Verifica que el usuario no haya superado el límite de mensajes de su plan este mes
async function checkMensajesMensuales(req, res, next) {
  if (!req.user?.userId) return next()

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('plan')
    .eq('id', req.user.userId)
    .single()

  const plan = PLANES[usuario?.plan ?? 'basico'] ?? PLANES.basico
  const limite = plan.chatMensual // null = ilimitado

  if (!limite) return next() // Plan sin límite mensual

  // Contar llamadas IA del usuario en el mes actual
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('uso_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', req.user.userId)
    .eq('es_principal', true)
    .gte('creado_en', inicioMes.toISOString())

  if (count >= limite) {
    return res.status(403).json({
      error: `Has alcanzado el límite de ${limite} consultas de IA de tu plan ${plan.nombre} este mes. Actualiza tu plan para continuar.`,
      codigo: 'LIMITE_PLAN_SUPERADO',
      planActual: usuario?.plan ?? 'basico',
      limite,
      usadas: count,
    })
  }

  next()
}

// Aplica ambas comprobaciones juntas (orden: circuit breaker → plan)
const checkIA = [checkCircuitBreaker, checkMensajesMensuales]

module.exports = { checkCircuitBreaker, checkMensajesMensuales, checkIA }
