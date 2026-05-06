const Anthropic = require('@anthropic-ai/sdk')
const supabase = require('../services/supabase')
const cache = require('../services/cache')

// Haiku para clasificaciones simples — 20x más barato que Sonnet
const client = new Anthropic()
const MODELO_BARATO = process.env.CLAUDE_CHEAP_MODEL ?? 'claude-haiku-4-5'

const SYSTEM_PROMPT = `Eres el Monitor de Alertas de ADSAI PRO. Tu función es clasificar si hay anomalías en los KPIs de Google Ads.

Clasifica el estado en UNO de estos niveles:
- "ok": Todo dentro de parámetros normales
- "info": Cambio menor a vigilar, no urgente
- "aviso": Degradación significativa que requiere atención
- "critico": Problema grave que requiere acción inmediata

Responde SOLO con JSON válido:
{
  "nivel": "ok|info|aviso|critico",
  "alertas": [
    { "severidad": "info|aviso|critico", "mensaje": "Descripción concisa del problema", "campana": "nombre si aplica" }
  ],
  "resumen": "Una frase del estado general"
}

Reglas:
- Sé conservador: solo alerta cuando haya anomalía real
- Mensajes en español, cortos y concretos (máximo 100 caracteres por alerta)
- Si todo está bien, devuelve nivel "ok" y alertas vacías`

const UMBRALES_DEFAULT = {
  cpaAumentoMaximo: 0.3,        // CPA sube más del 30% → aviso
  ctrCaidaMaxima: 0.25,         // CTR baja más del 25% → aviso
  gastoDesviacionMaxima: 0.4,   // Gasto se desvía >40% del ritmo → aviso
  presupuestoConsumidoCritico: 0.95, // 95% presupuesto gastado → crítico
  sinConversionesDias: 3,       // Sin conversiones 3+ días → crítico
}

async function checkAccount(cuentaId, metricasActuales, metricasAnteriores, umbrales = {}) {
  const config = { ...UMBRALES_DEFAULT, ...umbrales }

  // Calcular variaciones
  const variaciones = calcularVariaciones(metricasActuales, metricasAnteriores, config)

  // Si no hay nada notable, evitar llamada a la IA
  if (variaciones.length === 0) {
    return { nivel: 'ok', alertas: [], resumen: 'Todos los KPIs dentro de parámetros normales' }
  }

  const response = await client.messages.create({
    model: MODELO_BARATO,
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Clasifica estas variaciones detectadas en una cuenta de Google Ads. Responde SOLO con JSON:\n\n${JSON.stringify({ variaciones, metricasActuales }, null, 2)}`,
      },
    ],
  })

  try {
    const texto = response.content[0].text
    const match = texto.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : { nivel: 'info', alertas: [], resumen: texto }
  } catch {
    return { nivel: 'info', alertas: [], resumen: 'Error clasificando alertas' }
  }
}

function calcularVariaciones(actuales, anteriores, config) {
  const variaciones = []
  if (!anteriores) return variaciones

  const cpaCambio = pctCambio(actuales.cpaMedio, anteriores.cpaMedio)
  if (cpaCambio > config.cpaAumentoMaximo) {
    variaciones.push({ tipo: 'CPA alto', valor: `+${(cpaCambio * 100).toFixed(1)}%` })
  }

  const ctrCambio = pctCambio(actuales.ctr, anteriores.ctr)
  if (ctrCambio < -config.ctrCaidaMaxima) {
    variaciones.push({ tipo: 'CTR bajo', valor: `${(ctrCambio * 100).toFixed(1)}%` })
  }

  if (actuales.totalConversiones === 0) {
    variaciones.push({ tipo: 'Sin conversiones', valor: 'Ninguna conversión en el período' })
  }

  return variaciones
}

// Ejecuta el chequeo para todas las cuentas activas (llamado por el cron)
async function runForAllAccounts() {
  const { data: cuentas } = await supabase
    .from('cuentas_vinculadas')
    .select('id, customer_id, usuario_id')
    .eq('activa', true)

  if (!cuentas?.length) return

  const resultados = []
  for (const cuenta of cuentas) {
    const summaryActual = await cache.get(`account_summary:${cuenta.id}`)
    if (!summaryActual) continue

    const summaryAnterior = await cache.get(`account_summary_prev:${cuenta.id}`)
    const resultado = await checkAccount(cuenta.id, summaryActual, summaryAnterior)

    if (resultado.nivel !== 'ok' && resultado.alertas.length > 0) {
      await supabase.from('alertas').insert({
        cuenta_id: cuenta.id,
        usuario_id: cuenta.usuario_id,
        nivel: resultado.nivel,
        alertas: resultado.alertas,
        resumen: resultado.resumen,
      }).catch(() => {})
    }

    resultados.push({ cuentaId: cuenta.id, ...resultado })
  }

  console.log(`[AlertMonitor] Revisadas ${cuentas.length} cuentas — ${resultados.filter(r => r.nivel !== 'ok').length} con alertas`)
  return resultados
}

const pctCambio = (actual, anterior) =>
  anterior && anterior !== 0 ? (actual - anterior) / anterior : 0

module.exports = { checkAccount, runForAllAccounts, UMBRALES_DEFAULT }
