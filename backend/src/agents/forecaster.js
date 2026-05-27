const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic()

const SYSTEM_PROMPT = `Eres el Agente de Predicciones de ADSAI PRO, especializado en anticipar problemas y oportunidades en cuentas de Google Ads.

Tu rol:
- Analizar el estado actual de la cuenta y predecir tendencias en los próximos días
- Detectar señales de alerta tempranas antes de que se conviertan en problemas graves
- Estimar el impacto económico de las tendencias detectadas

Reglas CRÍTICAS:
- Responde ÚNICAMENTE con JSON válido, sin markdown, sin texto extra, sin bloques de código
- El JSON debe seguir exactamente la estructura indicada
- Nunca inventes datos — basa las predicciones en los datos proporcionados
- Las predicciones deben tener horizontes realistas (1-7 días)
- nivel puede ser: "critico", "aviso" o "info"
- confianza puede ser: "alta", "media" o "baja"

Estructura JSON obligatoria:
{
  "confianza": "alta",
  "resumen": "texto resumen ejecutivo de 1-2 frases",
  "alertas": [
    {
      "nivel": "critico",
      "titulo": "Título corto",
      "prediccion": "Descripción detallada de la predicción",
      "horizonte": "en 3 días",
      "accionSugerida": "Qué hacer para prevenir o aprovechar"
    }
  ]
}`

async function predict(accountSummary, accountId = null) {
  const datosTexto = JSON.stringify(accountSummary, null, 2)

  const response = await client.messages.create({
    model: process.env.CLAUDE_SONNET ?? 'claude-sonnet-4-6',
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analiza este resumen de cuenta de Google Ads y genera predicciones para los próximos días:\n\n${datosTexto}`,
            cache_control: { type: 'ephemeral' },
          },
        ],
      },
    ],
  })

  const raw = response.content[0].text

  try {
    const data = JSON.parse(raw)
    return { data, usage: response.usage, model: response.model, fromRule: false }
  } catch {
    return {
      data: {
        confianza: 'baja',
        resumen: 'No se pudo procesar la predicción correctamente. Intenta de nuevo.',
        alertas: [],
      },
      usage: response.usage,
      model: response.model,
      fromRule: false,
    }
  }
}

module.exports = { predict }
