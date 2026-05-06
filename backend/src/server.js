const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(morgan('dev'))
app.use(express.json())

// El webhook de Stripe necesita body raw — registrar antes del json parser
app.use('/api/billing/webhook', require('express').raw({ type: 'application/json' }))

// Rutas
app.use('/api/auth', require('./routes/auth'))
app.use('/api/accounts', require('./routes/accounts'))
app.use('/api/campaigns', require('./routes/campaigns'))
app.use('/api/ai', require('./routes/ai'))
app.use('/api/reports', require('./routes/reports'))
app.use('/api/competitors', require('./routes/competitors'))
app.use('/api/billing', require('./routes/stripe'))

app.get('/health', (req, res) => res.json({ ok: true, version: '0.1.0' }))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Error interno del servidor' })
})

app.listen(PORT, () => {
  console.log(`ADSAI PRO backend corriendo en http://localhost:${PORT}`)
  const { initScheduler } = require('./services/scheduler')
  initScheduler()
})
