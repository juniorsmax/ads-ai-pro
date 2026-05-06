const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

// Railway corre detrás de un proxy — necesario para req.ip correcto
app.set('trust proxy', 1)

app.use(helmet())

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
}))

app.use(morgan(isProd ? 'combined' : 'dev'))
app.use(express.json())

// El webhook de Stripe necesita body raw — registrar antes del json parser
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }))

// Rutas
app.use('/api/auth', require('./routes/auth'))
app.use('/api/accounts', require('./routes/accounts'))
app.use('/api/campaigns', require('./routes/campaigns'))
app.use('/api/ai', require('./routes/ai'))
app.use('/api/reports', require('./routes/reports'))
app.use('/api/competitors', require('./routes/competitors'))
app.use('/api/billing', require('./routes/stripe'))
app.use('/api/waitlist', require('./routes/waitlist'))
app.use('/api/feedback', require('./routes/feedback'))
app.use('/api/push', require('./routes/push'))

app.get('/health', (req, res) => res.json({ ok: true, version: '0.1.0', env: process.env.NODE_ENV }))

// Error handler global
app.use((err, req, res, next) => {
  if (!isProd) console.error(err.stack)
  res.status(err.status ?? 500).json({ error: isProd ? 'Error interno del servidor' : err.message })
})

const server = app.listen(PORT, () => {
  console.log(`ADSAI PRO backend corriendo en http://localhost:${PORT} [${process.env.NODE_ENV}]`)
  const { initScheduler } = require('./services/scheduler')
  initScheduler()
})

// Graceful shutdown para Railway
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido — cerrando servidor...')
  server.close(() => {
    console.log('Servidor cerrado correctamente')
    process.exit(0)
  })
})
