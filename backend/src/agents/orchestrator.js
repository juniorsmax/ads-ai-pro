const conversational = require('./conversational')
const performanceAnalyst = require('./performanceAnalyst')
const optimizer = require('./optimizer')
const copywriter = require('./copywriter')

function detectIntent(mensaje) {
  const m = mensaje.toLowerCase()
  if (/analiz|diagnos|rendimiento|problema|anomal|caída|bajó|subió/.test(m)) return 'analyze'
  if (/optim|puja|presupuesto|redistrib|pausa|activ|bid/.test(m)) return 'optimize'
  if (/copy|anuncio|texto|headline|descripci|rsa|pmax/.test(m)) return 'copy'
  if (/reporte|informe|pdf|exportar/.test(m)) return 'report'
  if (/competidor|competencia|rival/.test(m)) return 'competitor'
  return 'chat'
}

async function handle({ mensaje, historial, accountSummary, objetivos, copyContexto }) {
  const intent = detectIntent(mensaje)

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

    case 'chat':
    default:
      return { tipo: 'texto', contenido: await conversational.chat(mensaje, historial, accountSummary) }
  }
}

module.exports = { handle, detectIntent }
