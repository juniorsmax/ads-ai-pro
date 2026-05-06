const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic()

// Límites de caracteres de Google Ads
const LIMITES = {
  RSA: { headline: 30, description: 90, maxHeadlines: 15, maxDescriptions: 4 },
  PMAX: { headline: 30, description: 90, longHeadline: 90 },
  DISPLAY: { headline: 30, description: 90 },
}

const SYSTEM_PROMPT = `Eres el Agente Copywriter de ADSAI PRO, experto en redacción de anuncios de Google Ads en español.

Tu rol:
- Generar copies de alta calidad para RSA, Performance Max y Display
- Respetar ESTRICTAMENTE los límites de caracteres de Google Ads
- Mantener coherencia con el tono y valores de marca del cliente
- Puntuar predictivamente cada copy (0-100) basándote en mejores prácticas de CTR

Límites de caracteres (OBLIGATORIO respetar):
- Headline RSA/PMax/Display: máximo 30 caracteres
- Description RSA/PMax/Display: máximo 90 caracteres
- Long Headline PMax: máximo 90 caracteres

Formato de respuesta OBLIGATORIO (JSON válido):
{
  "tipo": "RSA|PMAX|DISPLAY",
  "headlines": [
    { "texto": "...", "chars": 25, "puntuacion": 85, "nota": "Por qué funciona" }
  ],
  "descriptions": [
    { "texto": "...", "chars": 78, "puntuacion": 80, "nota": "Por qué funciona" }
  ],
  "puntuacionGlobal": 82,
  "alertasPolitica": [],
  "consejo": "Recomendación principal para mejorar el copy"
}

Reglas:
- NUNCA superar los límites de caracteres (si el texto es más largo, recórtalo)
- Detectar y reportar posibles violaciones de políticas de Google (superlativos sin prueba, garantías absolutas, etc.)
- Usar los USPs y tono de marca del cliente
- Incluir CTAs claros y palabras de alta conversión en español`

async function generateCopy(tipo = 'RSA', contexto) {
  const { keywords, perfilMarca, copiesActuales } = contexto
  const limites = LIMITES[tipo] ?? LIMITES.RSA

  const input = {
    tipo,
    limites,
    keywords: keywords ?? [],
    perfilMarca: perfilMarca ?? {},
    copiesActuales: copiesActuales ?? [],
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
            text: `Genera copies de tipo ${tipo} para Google Ads. Responde SOLO con JSON válido:\n\n${JSON.stringify(input, null, 2)}`,
            cache_control: { type: 'ephemeral' },
          },
        ],
      },
    ],
  })

  const texto = response.content[0].text
  try {
    const match = texto.match(/\{[\s\S]*\}/)
    const resultado = match ? JSON.parse(match[0]) : null

    if (resultado) {
      // Validar y marcar los que superan el límite
      resultado.headlines = resultado.headlines?.map(h => ({
        ...h,
        chars: h.texto.length,
        excedeLimite: h.texto.length > limites.headline,
      })) ?? []
      resultado.descriptions = resultado.descriptions?.map(d => ({
        ...d,
        chars: d.texto.length,
        excedeLimite: d.texto.length > limites.description,
      })) ?? []
    }

    return resultado ?? { tipo, headlines: [], descriptions: [], error: 'No se pudo parsear la respuesta' }
  } catch {
    return { tipo, headlines: [], descriptions: [], error: texto }
  }
}

async function auditCopy(copies) {
  const response = await client.messages.create({
    model: process.env.CLAUDE_DEFAULT_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Audita estos copies existentes de Google Ads. Para cada uno indica puntuación (0-100), problemas detectados y mejora sugerida. Responde en JSON con array "auditoria": ${JSON.stringify(copies)}`,
      },
    ],
  })

  const texto = response.content[0].text
  try {
    const match = texto.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : { auditoria: [] }
  } catch {
    return { auditoria: [], raw: texto }
  }
}

module.exports = { generateCopy, auditCopy, LIMITES }
