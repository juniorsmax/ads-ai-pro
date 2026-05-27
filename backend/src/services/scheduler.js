const cron = require('node-cron')
const { runForAllAccounts } = require('../agents/alertMonitor')
const { weeklyReview } = require('./rulesEngine')
const supabase = require('./supabase')
const { snapshotQSCuenta } = require('../queues/snapshotQS')
const { decrypt } = require('./tokenCrypto')

async function snapshotQSParaTodasLasCuentas() {
  const { data: cuentas } = await supabase
    .from('cuentas_vinculadas')
    .select('id, customer_id, usuario_id')
    .eq('activa', true)

  if (!cuentas?.length) return

  const usuarioIds = [...new Set(cuentas.map(c => c.usuario_id))]
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, google_refresh_token')
    .in('id', usuarioIds)

  const tokenMap = Object.fromEntries((usuarios ?? []).map(u => [u.id, decrypt(u.google_refresh_token)]))

  for (const cuenta of cuentas) {
    const token = tokenMap[cuenta.usuario_id]
    if (!token) continue

    try {
      await snapshotQSCuenta(cuenta.id, cuenta.customer_id, token)
    } catch (err) {
      console.error(`[Cron QS] Error en cuenta ${cuenta.id}:`, err.message)
    }
  }
}

function initScheduler() {
  // Monitor de alertas — cada hora
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Ejecutando monitor de alertas...')
    try {
      await runForAllAccounts()
    } catch (err) {
      console.error('[Cron] Error en monitor de alertas:', err.message)
    }
  })

  // Snapshot diario de Quality Score — a las 02:00
  cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Guardando snapshot diario de Quality Score...')
    try {
      await snapshotQSParaTodasLasCuentas()
    } catch (err) {
      console.error('[Cron] Error en snapshot QS:', err.message)
    }
  })

  // Revisión semanal de reglas aprendidas — lunes a las 03:00
  cron.schedule('0 3 * * 1', async () => {
    console.log('[Cron] Iniciando revisión semanal de reglas aprendidas...')
    try {
      await weeklyReview()
    } catch (err) {
      console.error('[Cron] Error en revisión semanal de reglas:', err.message)
    }
  })

  console.log('[Scheduler] Cron jobs iniciados: alertas cada hora · QS snapshot a las 02:00 · revisión reglas cada lunes 03:00')
}

module.exports = { initScheduler }
