const cron = require('node-cron')
const { runForAllAccounts } = require('../agents/alertMonitor')

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

  console.log('[Scheduler] Cron jobs iniciados: monitor de alertas cada hora')
}

module.exports = { initScheduler }
