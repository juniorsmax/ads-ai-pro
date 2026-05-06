const Anthropic = require('@anthropic-ai/sdk')
const rulesEngine = require('../services/rulesEngine')

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

async function optimize(accountSummary, objetivos = {}, accountId = null) {
  // 1. Extraer señales de la situación de optimización
  const signals = rulesEngine.extractOptimizationSignals(accountSummary, objetivos)

  // 2. Buscar regla aprendida
  if (signals.length > 0) {
    const rule = await rulesEngine.findRule(accountId, 'optimizador', signals).catch(() => null)
    if (rule) {
      await rulesEngine.recordUsage(rule.id).catch(() => {})
      console.log(`[Optimizador] Regla aprendida aplicada — señales: ${signals.join(', ')} (tasa: ${rule.tasa_exito}%)`)
      try {
        // El accion del optimizador está serializado como JSON
        const data = JSON.parse(rule.accion)
        return { data, usage: null, model: 'regla_aprendida', fromRule: true }
      } catch {
        // Si no es JSON válido, ignorar la regla y llamar a Claude
      }
    }
  }

  // 3. Llamar a Claude
  const contexto = {
    datos: accountSummary,
    objetivos: {
      cpaObjetivo:        objetivos.cpaObjetivo        ?? null,
      roasObjetivo:       objetivos.roasObjetivo       ?? null,
      presupuestoMensual: objetivos.presupuestoMensual ?? null,
    },
  }

  const response = await client.messages.create({
    model: process.env.CLAUDE_SONNET ?? 'claude-sonnet-4-6',
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
  let data
  try {
    const match = texto.match(/\{[\s\S]*\}/)
    data = match ? JSON.parse(match[0]) : { resumen: texto, recomendaciones: [] }
  } catch {
    data = { resumen: texto, recomendaciones: [] }
  }

  // 4. Guardar como regla (JSON serializado)
  if (signals.length > 0) {
    rulesEngine.upsertRule(accountId, 'optimizador', signals, JSON.stringify(data)).catch(() => {})
  }

  return { data, usage: response.usage, model: response.model, fromRule: false }
}

module.exports = { optimize }
