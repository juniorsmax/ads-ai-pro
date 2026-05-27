const { Worker } = require('bullmq')
const googleAds = require('../../services/googleAds')
const cache = require('../../services/cache')
const supabase = require('../../services/supabase')
const { snapshotQSCuenta } = require('../snapshotQS')

const worker = new Worker('sync_job', async (job) => {
  const { cuentaId, usuarioId, refreshToken, tipo } = job.data

  if (tipo === 'google_ads') {
    const { data: cuenta } = await supabase
      .from('cuentas_vinculadas')
      .select('customer_id')
      .eq('id', cuentaId)
      .single()

    const summary = await googleAds.getAccountSummary(refreshToken, cuenta.customer_id)
    await cache.set(`account_summary:${cuentaId}`, summary)

    await supabase.from('sync_log').insert({
      cuenta_id: cuentaId,
      tipo:      'google_ads',
      estado:    'completado',
      detalle:   { campaigns: summary.campaigns?.length ?? 0 },
    }).catch(() => {})

    return summary
  }

  if (tipo === 'qs_snapshot') {
    const { data: cuenta } = await supabase
      .from('cuentas_vinculadas')
      .select('customer_id')
      .eq('id', cuentaId)
      .single()

    const result = await snapshotQSCuenta(cuentaId, cuenta.customer_id, refreshToken)

    await supabase.from('sync_log').insert({
      cuenta_id: cuentaId,
      tipo:      'qs_snapshot',
      estado:    'completado',
      detalle:   result,
    }).catch(() => {})

    return result
  }

  throw new Error(`Tipo de sync desconocido: ${tipo}`)
}, {
  connection: { url: process.env.REDIS_URL },
})

worker.on('failed', (job, err) => {
  console.error(`[syncWorker] Job ${job?.id} fallido:`, err.message)
  if (job) {
    supabase.from('sync_log').insert({
      cuenta_id: job.data.cuentaId,
      tipo:      job.data.tipo,
      estado:    'fallido',
      detalle:   { error: err.message },
    }).catch(() => {})
  }
})

module.exports = worker
