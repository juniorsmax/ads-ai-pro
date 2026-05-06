const nodemailer = require('nodemailer')
const supabase = require('./supabase')

// Precios por millón de tokens (USD) — console.anthropic.com/pricing
// La API puede devolver IDs con fecha (ej. claude-haiku-4-5-20251001), usamos startsWith
const PRECIOS = {
  'claude-sonnet-4-6': { input: 3.00, output: 15.00 },
  'claude-haiku-4-5':  { input: 0.25, output: 1.25  },
}

const LIMITE_DIARIO_USD = parseFloat(process.env.COSTE_DIARIO_LIMITE ?? '5')

// Clave Redis para coste acumulado del día actual
function keyCoste() {
  return `coste_diario:${new Date().toISOString().slice(0, 10)}`
}

function getRedis() {
  // Reutiliza el cliente Redis ya inicializado en cache.js
  const { getClient } = require('./cache')
  return getClient()
}

function calcularCoste(modelo, usage) {
  // startsWith para tolerar IDs con fecha ej. "claude-haiku-4-5-20251001"
  const key = Object.keys(PRECIOS).find(k => modelo?.startsWith(k)) ?? 'claude-sonnet-4-6'
  const precios = PRECIOS[key]
  return (usage.input_tokens / 1_000_000) * precios.input
    + (usage.output_tokens / 1_000_000) * precios.output
}

// esPrincipal=false marca llamadas internas (ej. detectIntent) que no cuentan
// contra el límite mensual del plan del usuario
async function registrarUso(usuarioId, agente, modelo, usage, esPrincipal = true) {
  if (!usage?.input_tokens) return

  const costeUsd = calcularCoste(modelo, usage)

  await supabase.from('uso_tokens').insert({
    usuario_id: usuarioId ?? null,
    agente,
    modelo,
    tokens_input:  usage.input_tokens,
    tokens_output: usage.output_tokens,
    coste_usd:     costeUsd,
    es_principal:  esPrincipal,
  }).catch((e) => console.error('[tokenTracker] Supabase insert:', e.message))

  // Acumular en Redis y comprobar límite diario
  const redis = getRedis()
  if (!redis) return

  const nuevoCoste = parseFloat(await redis.incrbyfloat(keyCoste(), costeUsd))
  // TTL de 48h para que el key no se quede huérfano
  await redis.expire(keyCoste(), 48 * 3600)

  if (nuevoCoste >= LIMITE_DIARIO_USD) {
    await activarCircuitBreaker(nuevoCoste)
  }
}

async function estaIAPausada() {
  const redis = getRedis()
  if (!redis) return false
  return !!(await redis.get('ia:pausado'))
}

async function activarCircuitBreaker(costeActual) {
  const redis = getRedis()
  if (!redis) return

  const hoy = new Date().toISOString().slice(0, 10)
  const yaAlertas = await redis.get(`ia:alerta_enviada:${hoy}`)
  if (yaAlertas) return // Solo una alerta por día

  // Calcular segundos hasta medianoche
  const ahora  = new Date()
  const manana = new Date(ahora)
  manana.setDate(manana.getDate() + 1)
  manana.setHours(0, 0, 0, 0)
  const ttl = Math.ceil((manana - ahora) / 1000)

  await redis.set('ia:pausado', '1', 'EX', ttl)
  await redis.set(`ia:alerta_enviada:${hoy}`, '1', 'EX', ttl)

  console.warn(`[tokenTracker] Coste diario $${costeActual.toFixed(4)} — IA pausada hasta medianoche`)
  await enviarAlertaEmail(costeActual)
}

async function getCosteDiario() {
  const redis = getRedis()
  if (!redis) return 0
  return parseFloat((await redis.get(keyCoste())) ?? '0')
}

async function enviarAlertaEmail(coste) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[tokenTracker] SMTP no configurado — alerta no enviada. Define SMTP_USER y SMTP_PASS.')
    return
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  const adminEmails = (process.env.ADMIN_EMAILS ?? process.env.SMTP_USER)
    .split(',').map(e => e.trim()).filter(Boolean)

  const fecha = new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })

  await transporter.sendMail({
    from: `"ADSAI PRO Alertas" <${process.env.SMTP_USER}>`,
    to: adminEmails.join(', '),
    subject: `🚨 ADSAI PRO — Coste IA superó $${LIMITE_DIARIO_USD} (${fecha})`,
    html: `
      <h2 style="color:#dc2626">⚠️ Alerta de coste de IA — ADSAI PRO</h2>
      <p>El coste acumulado de la API de Claude hoy ha superado el límite configurado.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0"><strong>Coste acumulado hoy:</strong></td><td><strong style="color:#dc2626">$${coste.toFixed(4)} USD</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0"><strong>Límite configurado:</strong></td><td>$${LIMITE_DIARIO_USD} USD</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><strong>Acción automática:</strong></td><td>Todos los endpoints de IA pausados hasta medianoche</td></tr>
      </table>
      <p>Revisa el uso detallado en <a href="https://console.anthropic.com/usage">console.anthropic.com/usage</a></p>
      <p style="font-size:12px;color:#6b7280">Este límite se puede ajustar con la variable de entorno <code>COSTE_DIARIO_LIMITE</code>.</p>
    `,
  }).catch((err) => console.error('[tokenTracker] Error enviando email:', err.message))
}

module.exports = { registrarUso, estaIAPausada, getCosteDiario }
