const Anthropic = require('@anthropic-ai/sdk')
const conversational = require('./conversational')
const performanceAnalyst = require('./performanceAnalyst')
const optimizer = require('./optimizer')
const copywriter = require('./copywriter')

const client = new Anthropic()

const INTENTS_VALIDOS = ['analyze', 'optimize', 'copy', 'competitors', 'report', 'general']

const SYSTEM_CLASSIFY = `Clasifica el mensaje del usuario en UNA de estas categorías y responde SOLO con esa palabra:
- analyze: quiere analizar rendimiento, diagnosticar problemas, ver métricas, entender por qué algo bajó o subió
- optimize: quiere optimizar pujas, presupuesto, pausar/activar campañas o keywords, redistribuir gasto
- copy: quiere generar o mejorar textos de anuncios, headlines, descripciones, RSA, PMax
- competitors: pregunta sobre competidores, competencia, auction insights, rivales
- report: quiere un reporte, informe, exportar datos, resumen en PDF
- general: cualquier otra consulta, saludo o pregunta general

Responde únicamente con una de las seis palabras.`

async function detectIntent(mensaje) {
  try {
    const response = await client.messages.create({
      model: process.env.CLAUDE_HAIKU ?? 'claude-haiku-4-5',
      max_tokens: 10,
      system: SYSTEM_CLASSIFY,
      messages: [{ role: 'user', content: mensaje }],
    })
    const intent = response.content[0].text.trim().toLowerCase()
    return {
      intent: INTENTS_VALIDOS.includes(intent) ? intent : 'general',
      usage: response.usage,
      model: response.model,
    }
  } catch {
    return { intent: 'general', usage: null, model: null }
  }
}

async function handle({ mensaje, historial, accountSummary, objetivos, copyContexto }) {
  const { intent, usage: usageIntent, model: modelIntent } = await detectIntent(mensaje)
  const usages = usageIntent ? [{ model: modelIntent, usage: usageIntent }] : []

  let tipo, contenido, subResult

  switch (intent) {
    case 'analyze':
      if (!accountSummary) {
        return { tipo: 'texto', contenido: 'Necesito datos de tu cuenta para hacer el análisis. Sincroniza tu cuenta de Google Ads primero.', usages }
      }
      subResult = await performanceAnalyst.analyze(accountSummary)
      tipo = 'analisis'
      contenido = subResult.data
      break

    case 'optimize':
      if (!accountSummary) {
        return { tipo: 'texto', contenido: 'Necesito datos actuales de tu cuenta para generar recomendaciones de optimización.', usages }
      }
      subResult = await optimizer.optimize(accountSummary, objetivos)
      tipo = 'optimizacion'
      contenido = subResult.data
      break

    case 'copy':
      subResult = await copywriter.generateCopy('RSA', copyContexto ?? {})
      tipo = 'copy'
      contenido = subResult.data
      break

    case 'general':
    default:
      subResult = await conversational.chat(mensaje, historial, accountSummary)
      tipo = 'texto'
      contenido = subResult.data
      break
  }

  if (subResult?.usage) usages.push({ model: subResult.model, usage: subResult.usage })
  return { tipo, contenido, usages }
}

module.exports = { handle, detectIntent }
