const { Worker } = require('bullmq')
const performanceAnalyst = require('../../agents/performanceAnalyst')
const optimizer = require('../../agents/optimizer')
const copywriter = require('../../agents/copywriter')
const { checkAccount } = require('../../agents/alertMonitor')
const cache = require('../../services/cache')
const supabase = require('../../services/supabase')

const worker = new Worker('ia_job', async (job) => {
  const { userId, agente, payload, cuentaId } = job.data
  let resultado

  switch (agente) {
    case 'analyze': {
      const accountSummary = await cache.get(`account_summary:${cuentaId}`)
      const { data } = await performanceAnalyst.analyze(accountSummary, cuentaId)
      resultado = data
      break
    }
    case 'optimize': {
      const accountSummary = await cache.get(`account_summary:${cuentaId}`)
      const { data } = await optimizer.optimize(accountSummary, payload?.objetivos ?? {}, cuentaId)
      resultado = data
      break
    }
    case 'copy': {
      const { data } = await copywriter.generateCopy(payload?.tipo ?? 'RSA', payload ?? {})
      resultado = data
      break
    }
    case 'copy_audit': {
      const { data } = await copywriter.auditCopy(payload?.copies ?? [])
      resultado = data
      break
    }
    case 'alerts': {
      const summaryActual   = await cache.get(`account_summary:${cuentaId}`)
      const summaryAnterior = await cache.get(`account_summary_prev:${cuentaId}`)
      resultado = await checkAccount(cuentaId, summaryActual, summaryAnterior)
      break
    }
    default:
      throw new Error(`Agente desconocido: ${agente}`)
  }

  await supabase.from('job_results').insert({
    job_id:      String(job.id),
    usuario_id:  userId,
    resultado,
    estado:      'completado',
  }).catch(err => console.error('[iaWorker] Error guardando resultado:', err.message))

  return resultado
}, {
  connection: { url: process.env.REDIS_URL },
})

worker.on('failed', (job, err) => {
  console.error(`[iaWorker] Job ${job?.id} fallido:`, err.message)
  if (job) {
    supabase.from('job_results').insert({
      job_id:     String(job.id),
      usuario_id: job.data.userId,
      resultado:  { error: err.message },
      estado:     'fallido',
    }).catch(() => {})
  }
})

module.exports = worker
