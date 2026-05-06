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
      model: process.env.CLAUDE_CHEAP_MODEL ?? 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      system: SYSTEM_CLASSIFY,
      messages: [{ role: 'user', content: mensaje }],
    })
    const intent = response.content[0].text.trim().toLowerCase()
    return INTENTS_VALIDOS.includes(intent) ? intent : 'general'
  } catch {
    return 'general'
  }
}

async function handle({ mensaje, historial, accountSummary, objetivos, copyContexto }) {
  const intent = await detectIntent(mensaje)

  switch (intent) {
    case 'analyze':
      if (!accountSummary) {
        return { tipo: 'texto', contenido: 'Necesito datos de tu cuenta para hacer el análisis. Sincroniza tu cuenta de Google Ads primero.' }
      }
      return { tipo: 'analisis', contenido: await performanceAnalyst.analyze(accountSummary) }

    case 'optimize':
      if (!accountSummary) {
        return { tipo: 'texto', contenido: 'Necesito datos actuales de tu cuenta para generar recomendaciones de optimización.' }
      }
      return { tipo: 'optimizacion', contenido: await optimizer.optimize(accountSummary, objetivos) }

    case 'copy':
      return { tipo: 'copy', contenido: await copywriter.generateCopy('RSA', copyContexto ?? {}) }

    case 'general':
    default:
      return { tipo: 'texto', contenido: await conversational.chat(mensaje, historial, accountSummary) }
  }
}

module.exports = { handle, detectIntent }
