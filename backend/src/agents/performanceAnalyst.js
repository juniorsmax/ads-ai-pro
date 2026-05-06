const Anthropic = require('@anthropic-ai/sdk')

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

async function analyze(accountSummary) {
  const datosTexto = JSON.stringify(accountSummary, null, 2)

  const response = await client.messages.create({
    model: process.env.CLAUDE_DEFAULT_MODEL ?? 'claude-sonnet-4-6',
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

  return response.content[0].text
}

module.exports = { analyze }
