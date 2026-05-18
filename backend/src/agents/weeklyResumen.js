const Anthropic = require('@anthropic-ai/sdk')
const client = new Anthropic()

function calcVar(actual, anterior) {
  if (!anterior || anterior === 0) return null
  return parseFloat(((actual - anterior) / anterior * 100).toFixed(1))
}

function sumarDias(dias, campo) {
  return dias.reduce((s, d) => s + (d[campo] ?? 0), 0)
}

function buildKPIs(diasAct, diasAnt) {
  const gasto1  = sumarDias(diasAct, 'gasto'),       gasto2  = sumarDias(diasAnt, 'gasto')
  const conv1   = sumarDias(diasAct, 'conversiones'), conv2   = sumarDias(diasAnt, 'conversiones')
  const clics1  = sumarDias(diasAct, 'clics'),        clics2  = sumarDias(diasAnt, 'clics')
  const impr1   = sumarDias(diasAct, 'impresiones'),  impr2   = sumarDias(diasAnt, 'impresiones')

  const ctr1 = impr1 > 0 ? clics1 / impr1 : 0
  const ctr2 = impr2 > 0 ? clics2 / impr2 : 0
  const cpa1 = conv1 > 0 ? gasto1 / conv1 : 0
  const cpa2 = conv2 > 0 ? gasto2 / conv2 : 0

  return {
    gasto:        { actual: gasto1,  anterior: gasto2,  var: calcVar(gasto1, gasto2) },
    conversiones: { actual: conv1,   anterior: conv2,   var: calcVar(conv1, conv2) },
    clics:        { actual: clics1,  anterior: clics2,  var: calcVar(clics1, clics2) },
    impresiones:  { actual: impr1,   anterior: impr2,   var: calcVar(impr1, impr2) },
    ctr:          { actual: ctr1,    anterior: ctr2,    var: calcVar(ctr1, ctr2) },
    cpa:          { actual: cpa1,    anterior: cpa2,    var: calcVar(cpa1, cpa2) },
  }
}

function fmt(n, decimales = 2) { return n.toFixed(decimales) }
function fmtVar(v) { return v == null ? 'N/A' : `${v > 0 ? '+' : ''}${v}%` }

async function generate(dias14) {
  const sorted  = [...dias14].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const mitad   = Math.ceil(sorted.length / 2)
  const diasAnt = sorted.slice(0, mitad)
  const diasAct = sorted.slice(mitad)

  const kpis = buildKPIs(diasAct, diasAnt)

  const prompt = `Genera un resumen semanal de Google Ads con estos KPIs (esta semana vs anterior):
- Gasto: €${fmt(kpis.gasto.actual)} (${fmtVar(kpis.gasto.var)})
- Conversiones: ${kpis.conversiones.actual} (${fmtVar(kpis.conversiones.var)})
- Clics: ${kpis.clics.actual} (${fmtVar(kpis.clics.var)})
- CTR: ${fmt(kpis.ctr.actual * 100)}% (${fmtVar(kpis.ctr.var)})
- CPA: €${fmt(kpis.cpa.actual)} (${fmtVar(kpis.cpa.var)})

Responde SOLO con JSON válido sin markdown:
{"ejecutivo":{"titular":"string max 10 palabras","resumen":"2-3 frases sin jerga técnica para el cliente","acciones":["acción 1","acción 2","acción 3"]},"tecnico":{"analisis":"2-3 frases para el gestor de cuentas","metricas_clave":["observación 1","observación 2"],"optimizaciones":["optimización 1","optimización 2"]}}`

  const response = await client.messages.create({
    model:      process.env.CLAUDE_SONNET ?? 'claude-sonnet-4-6',
    max_tokens: 800,
    system: 'Eres un experto analista de Google Ads. Responde SOLO con JSON válido sin markdown.',
    messages: [{ role: 'user', content: prompt }],
  })

  const usage = response.usage
  const model = response.model

  try {
    const parsed = JSON.parse(response.content[0].text)
    return { data: { ...parsed, kpis }, usage, model }
  } catch {
    return {
      data: {
        kpis,
        ejecutivo: {
          titular:  'Resumen semanal de rendimiento',
          resumen:  `Esta semana: ${kpis.conversiones.actual} conversiones con €${fmt(kpis.gasto.actual)} de gasto.`,
          acciones: ['Revisar keywords sin conversiones', 'Optimizar pujas con CPA alto', 'Revisar extensiones de anuncio'],
        },
        tecnico: {
          analisis:      `CTR ${fmt(kpis.ctr.actual * 100)}%, CPA €${fmt(kpis.cpa.actual)}.`,
          metricas_clave: [],
          optimizaciones: [],
        },
      },
      usage,
      model,
    }
  }
}

module.exports = { generate, buildKPIs }
