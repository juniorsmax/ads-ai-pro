const Anthropic = require('@anthropic-ai/sdk')
const rulesEngine = require('../services/rulesEngine')

const client = new Anthropic()

const SYSTEM_PROMPT = `Eres el Agente Analista de Rendimiento de ADSAI PRO, una herramienta profesional de gestión de Google Ads en español.

Tu rol:
- Analizar métricas de campañas de Google Ads y detectar anomalías
- Identificar qué campañas, grupos y keywords están drenando presupuesto sin convertir
- Comparar rendimiento actual vs período anterior
- Generar diagnósticos claros y puntos de acción priorizados

Reglas:
- Responde SIEMPRE en español, con un tono profesional pero claro
- Nunca inventes datos — trabaja exclusivamente con los datos proporcionados
- Cada recomendación debe incluir el PORQUÉ (explicabilidad)
- Prioriza por impacto económico: lo que más dinero está costando o perdiendo
- Sé conciso: máximo 3-5 puntos de acción
- Usa cifras específicas de los datos (€, %, CPA)
- Formato: diagnóstico breve → alertas → recomendaciones numeradas`

async function analyze(accountSummary, accountId = null) {
  // 1. Extraer señales de la situación actual
  const signals = rulesEngine.extractAnalysisSignals(accountSummary)

  // 2. Buscar regla aprendida (evitar llamar a Claude si existe una buena)
  if (signals.length > 0) {
    const rule = await rulesEngine.findRule(accountId, 'analista', signals).catch(() => null)
    if (rule) {
      await rulesEngine.recordUsage(rule.id).catch(() => {})
      console.log(`[Analista] Regla aprendida aplicada — señales: ${signals.join(', ')} (tasa: ${rule.tasa_exito}%)`)
      return { data: rule.accion, usage: null, model: 'regla_aprendida', fromRule: true }
    }
  }

  // 3. Llamar a Claude
  const datosTexto = JSON.stringify(accountSummary, null, 2)
  const response = await client.messages.create({
    model: process.env.CLAUDE_SONNET ?? 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analiza el siguiente resumen de cuenta de Google Ads y proporciona un diagnóstico de rendimiento con recomendaciones concretas:\n\n${datosTexto}`,
            cache_control: { type: 'ephemeral' },
          },
        ],
      },
    ],
  })

  const data = response.content[0].text

  // 4. Guardar como regla para futuras consultas similares
  if (signals.length > 0) {
    rulesEngine.upsertRule(accountId, 'analista', signals, data).catch(() => {})
  }

  return { data, usage: response.usage, model: response.model, fromRule: false }
}

// Variante streaming: revisa reglas primero; si existe, emite el texto almacenado al instante
async function analyzeStream(accountSummary, sse, accountId = null) {
  const signals = rulesEngine.extractAnalysisSignals(accountSummary)

  if (signals.length > 0) {
    const rule = await rulesEngine.findRule(accountId, 'analista', signals).catch(() => null)
    if (rule) {
      await rulesEngine.recordUsage(rule.id).catch(() => {})
      sse('delta', { text: rule.accion })
      sse('info', { fromRule: true, tasa_exito: rule.tasa_exito })
      return { usage: null, model: 'regla_aprendida', fromRule: true }
    }
  }

  // Sin regla → stream desde Claude
  const datosTexto = JSON.stringify(accountSummary, null, 2)
  const stream = client.messages.stream({
    model: process.env.CLAUDE_SONNET ?? 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analiza el siguiente resumen de cuenta de Google Ads y proporciona un diagnóstico de rendimiento con recomendaciones concretas:\n\n${datosTexto}`,
            cache_control: { type: 'ephemeral' },
          },
        ],
      },
    ],
  })

  let fullText = ''
  for await (const text of stream.textStream) {
    fullText += text
    sse('delta', { text })
  }

  const msg = await stream.finalMessage()

  // Aprender de la respuesta recibida
  if (signals.length > 0 && fullText) {
    rulesEngine.upsertRule(accountId, 'analista', signals, fullText).catch(() => {})
  }

  return { usage: msg.usage, model: msg.model, fromRule: false }
}

module.exports = { analyze, analyzeStream }
