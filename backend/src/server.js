const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

const { sidecarIA, sidecarGeneral, sidecarAuth, sidecarWaitlist } = require('./middleware/sidecar')

const app = express()
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV !== 'development'

// Railway corre detrás de un proxy — necesario para req.ip correcto
app.set('trust proxy', 1)

// ── Seguridad ────────────────────────────────────────────────────────────────

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false,
}))

// CORS — acepta la URL del frontend en producción, cualquier origen en dev
const allowedOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: isProd
    ? (origin, cb) => {
        if (!origin || allowedOrigins.some(o => origin.startsWith(o))) cb(null, true)
        else cb(new Error(`CORS bloqueado: ${origin}`))
      }
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Parsers ──────────────────────────────────────────────────────────────────

app.use(morgan(isProd ? 'combined' : 'dev'))

// El webhook de Stripe necesita body raw — ANTES del json parser
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }))

// Límite de 10mb para evitar payloads abusivos
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: false, limit: '10mb' }))

// ── Rutas ─────────────────────────────────────────────────────────────────────

app.use('/api/auth',         sidecarAuth,     require('./routes/auth'))
app.use('/api/waitlist',     sidecarWaitlist, require('./routes/waitlist'))
app.use('/api/ai',           sidecarIA,       require('./routes/ai'))
app.use('/api/accounts',     sidecarGeneral,  require('./routes/accounts'))
app.use('/api/campaigns',    sidecarGeneral,  require('./routes/campaigns'))
app.use('/api/reports',      sidecarGeneral,  require('./routes/reports'))
app.use('/api/competitors',  sidecarGeneral,  require('./routes/competitors'))
app.use('/api/billing',      sidecarGeneral,  require('./routes/stripe'))
app.use('/api/keywords',     sidecarGeneral,  require('./routes/keywords'))
app.use('/api/settings',     sidecarGeneral,  require('./routes/settings'))
app.use('/api/feedback',     sidecarGeneral,  require('./routes/feedback'))
app.use('/api/push',         sidecarGeneral,  require('./routes/push'))
app.use('/api/hostinger',    sidecarGeneral,  require('./routes/hostinger'))
app.use('/api/supermetrics', sidecarGeneral,  require('./routes/supermetrics'))
app.use('/api/auditoria',    sidecarGeneral,  require('./routes/auditoria'))
app.use('/api/integraciones',sidecarGeneral,  require('./routes/integraciones'))
app.use('/api/optimizer',    sidecarGeneral,  require('./routes/optimizer'))

// ── Health & error handler ────────────────────────────────────────────────────

app.get('/health', (req, res) => res.json({ ok: true, version: '0.1.0', env: process.env.NODE_ENV }))

app.use((err, req, res, next) => {
  if (!isProd) console.error(err.stack)
  res.status(err.status ?? 500).json({ error: isProd ? 'Error interno del servidor' : err.message })
})

// ── Arranque ─────────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`ADSAI PRO backend corriendo en http://localhost:${PORT} [${process.env.NODE_ENV}]`)
  const { initScheduler } = require('./services/scheduler')
  initScheduler()

  if (process.env.REDIS_URL) {
    require('./queues/workers/iaWorker')
    require('./queues/workers/syncWorker')
    console.log('[Workers] iaWorker y syncWorker iniciados')
  }
})

process.on('SIGTERM', () => {
  console.log('SIGTERM recibido — cerrando servidor...')
  const analytics = require('./services/analytics')
  server.close(async () => {
    await analytics.shutdown()
    console.log('Servidor cerrado correctamente')
    process.exit(0)
  })
})
