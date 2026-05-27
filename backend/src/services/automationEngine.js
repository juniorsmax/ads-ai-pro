const supabase = require('./supabase')
const cache = require('./cache')
const rulesEngine = require('./rulesEngine')

async function run(cuentaId, usuarioId, accountSummary, { dryRun = true } = {}) {
  const signals = rulesEngine.extractAnalysisSignals(accountSummary)

  const acciones = []

  if (signals.includes('cpa_alto')) {
    acciones.push({
      tipo_accion: 'pausar_keywords_bajo_rendimiento',
      target_id: cuentaId,
      motivo: 'CPA supera objetivo en más del 20%',
    })
  }

  if (signals.includes('ctr_bajo')) {
    acciones.push({
      tipo_accion: 'revisar_copies_anuncios',
      target_id: cuentaId,
      motivo: 'CTR por debajo del 1.5%',
    })
  }

  if (signals.includes('sin_conversiones')) {
    acciones.push({
      tipo_accion: 'revisar_landing_pages',
      target_id: cuentaId,
      motivo: 'Sin conversiones en el período',
    })
  }

  if (signals.includes('gasto_bajo')) {
    acciones.push({
      tipo_accion: 'ampliar_targeting',
      target_id: cuentaId,
      motivo: 'Presupuesto infrautilizado (< 40%)',
    })
  }

  if (signals.includes('presupuesto_agotado')) {
    acciones.push({
      tipo_accion: 'revisar_presupuesto_diario',
      target_id: cuentaId,
      motivo: 'Presupuesto agotado antes del fin del día',
    })
  }

  if (acciones.length === 0) {
    acciones.push({
      tipo_accion: 'monitoreo_continuo',
      target_id: cuentaId,
      motivo: 'Cuenta dentro de parámetros normales',
    })
  }

  if (!dryRun) {
    const rows = acciones.map(a => ({
      cuenta_id: cuentaId,
      usuario_id: usuarioId,
      tipo_accion: a.tipo_accion,
      target_id: a.target_id,
      motivo: a.motivo,
      resultado: 'ejecutado',
    }))
    await supabase.from('automation_log').insert(rows)
  }

  return { acciones, dryRun, total: acciones.length }
}

module.exports = { run }
