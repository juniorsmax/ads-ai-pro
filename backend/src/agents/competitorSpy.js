const Anthropic = require('@anthropic-ai/sdk')
const { GoogleAdsApi } = require('google-ads-api')

const client = new Anthropic()

const SYSTEM_PROMPT = `Eres el Agente Espía Competitivo de ADSAI PRO. Analizas los movimientos de la competencia en Google Ads y generas estrategias de respuesta.

Tu rol:
- Interpretar datos de Auction Insights y detectar cambios significativos
- Identificar qué competidores están ganando cuota de impresión
- Detectar nuevas keywords donde aparecen competidores
- Sugerir estrategias de respuesta concretas con datos

Formato de respuesta OBLIGATORIO (JSON válido):
{
  "resumen": "Situación competitiva en una frase",
  "competidoresDestacados": [
    {
      "dominio": "competidor.com",
      "cuotaImpresion": "45%",
      "tendencia": "subiendo|bajando|estable",
      "amenaza": "alta|media|baja",
      "observacion": "Dato relevante específico"
    }
  ],
  "movimientosDetectados": ["Movimiento 1", "Movimiento 2"],
  "estrategias": [
    {
      "titulo": "Acción concreta",
      "descripcion": "Qué hacer exactamente",
      "prioridad": "alta|media|baja",
      "impacto": "Resultado esperado"
    }
  ],
  "alertas": []
}

Reglas:
- Máximo 3 estrategias, ordenadas por impacto
- Nunca inventar datos — basarte solo en los Auction Insights proporcionados
- Respuestas en español, con datos específicos (%, €, posiciones)`

async function analyzeCompetitors(auctionInsights, customerId) {
  if (!auctionInsights?.length) {
    return {
      resumen: 'No hay datos de competidores disponibles para esta cuenta.',
      competidoresDestacados: [],
      movimientosDetectados: [],
      estrategias: [],
      alertas: [],
    }
  }

  const response = await client.messages.create({
    model: process.env.CLAUDE_SONNET ?? 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Analiza estos datos de Auction Insights de Google Ads y genera un informe de inteligencia competitiva. Responde SOLO con JSON:\n\n${JSON.stringify(auctionInsights, null, 2)}`,
          cache_control: { type: 'ephemeral' },
        },
      ],
    }],
  })

  try {
    const match = response.content[0].text.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : { resumen: response.content[0].text, competidoresDestacados: [], estrategias: [] }
  } catch {
    return { resumen: response.content[0].text, competidoresDestacados: [], estrategias: [] }
  }
}

async function getAuctionInsights(refreshToken, customerId) {
  const gadsClient = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  })

  const customer = gadsClient.Customer({
    customer_id: customerId,
    refresh_token: refreshToken,
    login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  })

  const rows = await customer.query(`
    SELECT
      auction_insight.domain,
      auction_insight.impression_share,
      auction_insight.overlap_rate,
      auction_insight.outranking_share,
      auction_insight.position_above_rate,
      auction_insight.top_of_page_rate,
      auction_insight.abs_top_of_page_rate,
      segments.date
    FROM auction_insight_performance_view
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY auction_insight.impression_share DESC
    LIMIT 20
  `)

  // Agrupar por dominio y calcular promedios
  const porDominio = {}
  for (const row of rows) {
    const d = row.auction_insight.domain
    if (!d) continue
    if (!porDominio[d]) porDominio[d] = { domain: d, impressionShares: [], overlapRates: [], outrankingShares: [] }
    porDominio[d].impressionShares.push(row.auction_insight.impression_share ?? 0)
    porDominio[d].overlapRates.push(row.auction_insight.overlap_rate ?? 0)
    porDominio[d].outrankingShares.push(row.auction_insight.outranking_share ?? 0)
  }

  return Object.values(porDominio).map(d => ({
    dominio: d.domain,
    cuotaImpresion: pct(avg(d.impressionShares)),
    tasaSolapamiento: pct(avg(d.overlapRates)),
    tasaSuperacion: pct(avg(d.outrankingShares)),
  }))
}

const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
const pct = v => `${(v * 100).toFixed(1)}%`

module.exports = { analyzeCompetitors, getAuctionInsights }
