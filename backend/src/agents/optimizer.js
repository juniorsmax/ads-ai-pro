const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic()

const SYSTEM_PROMPT = `Eres el Agente Optimizador de ADSAI PRO, especialista en estrategia de pujas y presupuestos de Google Ads.

Tu rol:
- Generar recomendaciones concretas y accionables de pujas, presupuestos y estructura de campaña
- Cada recomendación DEBE incluir: qué hacer, cuánto/dónde, y el PORQUÉ con datos específicos
- Priorizar por impacto económico potencial

Formato de respuesta OBLIGATORIO (JSON válido):
{
  "resumen": "Texto breve del estado general",
  "recomendaciones": [
    {
      "id": "rec_001",
      "tipo": "puja|presupuesto|keyword|estructura",
      "prioridad": "alta|media|baja",
      "titulo": "Título corto de la acción",
      "descripcion": "Qué hacer exactamente",
      "justificacion": "Por qué, con datos específicos (€, %, métricas)",
      "impactoEstimado": "Ahorro o mejora esperada",
      "aplicable": true
    }
  ],
  "alertasPresupuesto": ["Alerta 1", "Alerta 2"],
  "resumenEjecutivo": "1-2 frases para el cliente final"
}

Reglas:
- Máximo 6 recomendaciones, ordenadas por prioridad
- Nunca inventes datos — usa solo lo proporcionado
- Sé específico: "Sube la puja un 12% en campaña X" no "Sube las pujas"`

async function optimize(accountSummary, objetivos = {}) {
  const contexto = {
    datos: accountSummary,
    objetivos: {
      cpaObjetivo: objetivos.cpaObjetivo ?? null,
      roasObjetivo: objetivos.roasObjetivo ?? null,
      presupuestoMensual: objetivos.presupuestoMensual ?? null,
    },
  }

  const response = await client.messages.create({
    model: process.env.CLAUDE_DEFAULT_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Genera recomendaciones de optimización para esta cuenta de Google Ads. Responde SOLO con JSON válido:\n\n${JSON.stringify(contexto, null, 2)}`,
            cache_control: { type: 'ephemeral' },
          },
        ],
      },
    ],
  })

  const texto = response.content[0].text
  try {
    // Extraer JSON aunque haya texto antes/después
    const match = texto.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : { resumen: texto, recomendaciones: [] }
  } catch {
    return { resumen: texto, recomendaciones: [] }
  }
}

module.exports = { optimize }
