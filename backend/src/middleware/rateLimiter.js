const { rateLimit, ipKeyGenerator } = require('express-rate-limit')

const mensaje429 = (tipo) => ({
  handler: (req, res) =>
    res.status(429).json({ error: `Demasiadas peticiones. ${tipo}` }),
})

// 100 req / 15 min — límite general para todas las rutas
const general = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensaje429('Inténtalo de nuevo en 15 minutos.'),
})

// 10 req / 15 min — rutas de IA (análisis, optimización, copies, etc.)
const ia = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensaje429('Límite de consultas IA alcanzado. Espera 15 minutos.'),
})

// 20 mensajes / hora — chat por usuario autenticado (se aplica tras el middleware auth)
const chatPorUsuario = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId ?? ipKeyGenerator(req),
  ...mensaje429('Has alcanzado el límite de 20 mensajes por hora.'),
})

// 5 req / hora — rutas de autenticación (evitar fuerza bruta)
const auth = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensaje429('Demasiados intentos de autenticación. Espera 1 hora.'),
})

// 3 req / hora — waitlist (evitar spam de emails)
const waitlist = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  ...mensaje429('Demasiados registros desde esta IP. Espera 1 hora.'),
})

// 5 req / hora — IPs no autenticadas en rutas de IA
// Las requests con token de auth saltan este límite (tienen su propio control por usuario/plan)
const iaNoAuth = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !!req.headers.authorization,
  ...mensaje429('Límite de 5 consultas/hora para acceso no autenticado.'),
})

module.exports = { general, ia, chatPorUsuario, auth, waitlist, iaNoAuth }
