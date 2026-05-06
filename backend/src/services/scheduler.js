const cron = require('node-cron')
const { runForAllAccounts } = require('../agents/alertMonitor')
const { weeklyReview } = require('./rulesEngine')

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

  // Revisión semanal de reglas aprendidas — lunes a las 03:00
  cron.schedule('0 3 * * 1', async () => {
    console.log('[Cron] Iniciando revisión semanal de reglas aprendidas...')
    try {
      await weeklyReview()
    } catch (err) {
      console.error('[Cron] Error en revisión semanal de reglas:', err.message)
    }
  })

  console.log('[Scheduler] Cron jobs iniciados: alertas cada hora · revisión reglas cada lunes 03:00')
}

module.exports = { initScheduler }
