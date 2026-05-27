const auth = require('./auth')
const { injectPlan } = require('./planCheck')
const { checkCircuitBreaker, checkMensajesMensuales } = require('./planLimiter')
const { general: limiterGeneral, ia: limiterIA, auth: limiterAuth, waitlist: limiterWaitlist } = require('./rateLimiter')

const sidecarIA = [
  auth,
  injectPlan,
  checkCircuitBreaker,
  checkMensajesMensuales,
  limiterIA,
]

const sidecarGeneral = [
  auth,
  injectPlan,
  limiterGeneral,
]

const sidecarAuth = [
  limiterAuth,
]

const sidecarWaitlist = [
  limiterWaitlist,
]

module.exports = { sidecarIA, sidecarGeneral, sidecarAuth, sidecarWaitlist }
