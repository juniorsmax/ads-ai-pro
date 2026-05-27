const Anthropic = require('@anthropic-ai/sdk')
const supabase = require('./supabase')
const { estaIAPausada, registrarUso } = require('./tokenTracker')

const client = new Anthropic()

const TASA_MINIMA   = 70   // Se usa la regla solo si tasa_exito >= 70%
const TASA_INICIAL  = 80   // Nueva regla arranca con 80% (optimista, revisión semanal la ajusta)
const MIN_REVIEW    = 3    // Reglas revisadas solo cuando veces_aplicada >= 3
const MAX_REVIEW    = 40   // Máximo de reglas por ciclo de revisión semanal

// ── Extracción de señales ─────────────────────────────────────────────────────
// Cada señal es un string corto que describe una situación detectable en la cuenta.
// El conjunto de señales es la "huella" que identifica una situación recurrente.

function extractAnalysisSignals(accountSummary) {
  const signals = []
  const { cpaMedio, cpaObjetivo, ctr, totalConversiones, gastoTotal, presupuestoDiario } = accountSummary ?? {}

  if (cpaObjetivo && cpaMedio > cpaObjetivo * 1.2)                  signals.push('cpa_alto')
  if (ctr != null && ctr < 0.015)                                    signals.push('ctr_bajo')
  if (totalConversiones === 0)                                        signals.push('sin_conversiones')
  if (presupuestoDiario && gastoTotal != null && gastoTotal < presupuestoDiario * 0.4)     signals.push('gasto_bajo')
  if (ctr != null && ctr > 0.08)                                     signals.push('ctr_excepcional')

  return signals
}

function extractOptimizationSignals(accountSummary, objetivos = {}) {
  const signals = []
  const { cpaMedio, roas, gastoTotal, presupuestoDiario } = accountSummary ?? {}
  const { cpaObjetivo, roasObjetivo } = objetivos

  if (cpaObjetivo && cpaMedio > cpaObjetivo * 1.15)                  signals.push('cpa_sobre_objetivo')
  if (roasObjetivo && roas != null && roas < roasObjetivo * 0.85)    signals.push('roas_bajo_objetivo')
  if (presupuestoDiario && gastoTotal != null && gastoTotal > presupuestoDiario * 0.9)     signals.push('presupuesto_agotado')
  if (presupuestoDiario && gastoTotal != null && gastoTotal < presupuestoDiario * 0.5)     signals.push('infrautilizando_presupuesto')

  return signals
}

// Serializa señales en una clave única ordenada: ["cpa_alto", "ctr_bajo"] → "cpa_alto+ctr_bajo"
function signalKey(signals) {
  return signals.length > 0 ? [...signals].sort().join('+') : null
}

// ── Operaciones de reglas ─────────────────────────────────────────────────────

async function findRule(accountId, agente, signals) {
  if (!accountId) return null
  const key = signalKey(signals)
  if (!key) return null

  const { data, error } = await supabase
    .from('learned_rules')
    .select('id, accion, tasa_exito, veces_aplicada')
    .eq('account_id', accountId)
    .eq('agente', agente)
    .eq('condicion_key', key)
    .gte('tasa_exito', TASA_MINIMA)
    .maybeSingle()

  return error ? null : data
}

async function upsertRule(accountId, agente, signals, accion) {
  if (!accountId) return
  const key = signalKey(signals)
  if (!key) return

  const { data: existing } = await supabase
    .from('learned_rules')
    .select('id, tasa_exito')
    .eq('account_id', accountId)
    .eq('agente', agente)
    .eq('condicion_key', key)
    .maybeSingle()

  if (existing) {
    // Si la regla existía pero tenía baja tasa, Claude la generó de nuevo → actualizamos accion y reseteamos tasa
    await supabase.from('learned_rules').update({
      accion,
      tasa_exito: TASA_INICIAL,
      ultima_actualizacion: new Date().toISOString(),
    }).eq('id', existing.id)
  } else {
    await supabase.from('learned_rules').insert({
      account_id:   accountId,
      agente,
      condicion_key: key,
      condicion:    { signals },
      accion,
      tasa_exito:   TASA_INICIAL,
    }).catch((e) => console.error('[RulesEngine] insert error:', e.message))
  }
}

async function recordUsage(ruleId) {
  const { error } = await supabase.rpc('increment_rule_usage', { rule_id: ruleId })
  if (error) {
    const { data } = await supabase.from('learned_rules')
      .select('veces_aplicada').eq('id', ruleId).single()
    if (data) await supabase.from('learned_rules')
      .update({ veces_aplicada: data.veces_aplicada + 1, ultima_actualizacion: new Date().toISOString() })
      .eq('id', ruleId)
  }
}

// ── Revisión semanal por Claude ───────────────────────────────────────────────

const SYSTEM_REVIEW = `Eres el revisor de conocimiento de ADSAI PRO. Evalúas la calidad de reglas aprendidas de Google Ads.

Cada regla tiene:
- condicion.signals: señales que activaron la regla (ej: ["cpa_alto", "sin_conversiones"])
- accion: la recomendación almacenada
- veces_aplicada: cuántas veces se usó esta regla en vez de llamar a Claude

Asigna tasa_exito (0-100) según la calidad de la acción para sus señales:
- 85-100: Excelente — específica, accionable y coherente con las señales
- 70-84: Buena — correcta aunque podría ser más concreta
- 50-69: Regular — demasiado genérica, escaso valor diferencial
- 0-49: Deficiente — incoherente con las señales o contradice buenas prácticas de Google Ads

Si el texto de accion puede mejorarse (corrección, mayor especificidad, mejor estructura),
reescríbelo. Si está bien como está, devuelve accion_actualizada: null.

Responde ÚNICAMENTE con un array JSON válido (sin texto adicional):
[{ "id": "uuid", "tasa_exito": 85, "accion_actualizada": "texto mejorado o null" }]`

async function weeklyReview() {
  if (await estaIAPausada()) {
    console.log('[RulesEngine] Revisión semanal abortada — circuit breaker activo')
    return
  }

  const { data: rules, error } = await supabase
    .from('learned_rules')
    .select('id, agente, condicion, condicion_key, accion, veces_aplicada, tasa_exito')
    .gte('veces_aplicada', MIN_REVIEW)
    .order('veces_aplicada', { ascending: false })
    .limit(MAX_REVIEW)

  if (error || !rules?.length) {
    console.log('[RulesEngine] Revisión semanal: sin reglas con suficiente historial')
    return
  }

  console.log(`[RulesEngine] Revisando ${rules.length} reglas...`)

  const response = await client.messages.create({
    model: process.env.CLAUDE_SONNET ?? 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: SYSTEM_REVIEW,
    messages: [{
      role: 'user',
      content: `Revisa estas ${rules.length} reglas aprendidas y devuelve el array JSON con tasa_exito actualizada:\n\n${JSON.stringify(rules, null, 2)}`,
    }],
  })

  await registrarUso(null, 'weeklyReview', response.model, response.usage, false)

  try {
    const texto  = response.content[0].text
    const match  = texto.match(/\[[\s\S]*\]/)
    const updates = match ? JSON.parse(match[0]) : []

    const validIds = new Set(rules.map(r => r.id))
    let actualizadas = 0
    for (const upd of updates) {
      if (!upd.id || upd.tasa_exito == null) continue
      if (!validIds.has(upd.id)) continue
      const cambios = {
        tasa_exito:          Math.min(100, Math.max(0, upd.tasa_exito)),
        ultima_actualizacion: new Date().toISOString(),
      }
      if (upd.accion_actualizada) cambios.accion = upd.accion_actualizada

      await supabase.from('learned_rules').update(cambios).eq('id', upd.id)
      actualizadas++
    }

    console.log(`[RulesEngine] Revisión semanal: ${actualizadas}/${rules.length} reglas actualizadas`)
  } catch (err) {
    console.error('[RulesEngine] Error en revisión semanal:', err.message)
  }
}

module.exports = {
  extractAnalysisSignals,
  extractOptimizationSignals,
  signalKey,
  findRule,
  upsertRule,
  recordUsage,
  weeklyReview,
}
