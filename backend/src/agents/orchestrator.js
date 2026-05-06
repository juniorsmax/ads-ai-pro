const conversational = require('./conversational')
const performanceAnalyst = require('./performanceAnalyst')

// Detecta la intención de la solicitud y enruta al agente correcto
function detectIntent(mensaje) {
  const m = mensaje.toLowerCase()
  if (/analiz|diagnos|rendimiento|problema|anomal/.test(m)) return 'analyze'
  if (/optim|puja|presupuesto|keyword|pausa|activ/.test(m)) return 'optimize'
  if (/copy|anuncio|texto|headline|descripci/.test(m)) return 'copy'
  if (/reporte|informe|pdf|exportar/.test(m)) return 'report'
  if (/competidor|competencia|rival/.test(m)) return 'competitor'
  return 'chat'
}

async function handle({ mensaje, historial, accountSummary }) {
  const intent = detectIntent(mensaje)

  switch (intent) {
    case 'analyze':
      if (!accountSummary) {
        return 'Necesito datos de tu cuenta para hacer el análisis. Conecta tu cuenta de Google Ads primero.'
      }
      return performanceAnalyst.analyze(accountSummary)

    case 'chat':
    default:
      return conversational.chat(mensaje, historial, accountSummary)
  }
}

module.exports = { handle, detectIntent }
