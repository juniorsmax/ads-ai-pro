const MIN_GASTO_EUR = 10   // €10 mínimo para aparecer en análisis
const GASTO_NEGATIVA = 25  // €25 sin conversión → sugerir como negativa
const MAX_RESULTADOS = 100

function extraerNgrams(texto, n) {
  const palabras = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(p => p.length > 1)

  const ngrams = []
  for (let i = 0; i <= palabras.length - n; i++) {
    ngrams.push(palabras.slice(i, i + n).join(' '))
  }
  return ngrams
}

function analizar(searchTerms) {
  const mapa = new Map()

  for (const term of searchTerms) {
    for (let n = 1; n <= 3; n++) {
      for (const ngram of extraerNgrams(term.searchTerm, n)) {
        const prev = mapa.get(ngram) ?? { gasto: 0, conversiones: 0, apariciones: 0 }
        mapa.set(ngram, {
          gasto:       prev.gasto + term.cost,
          conversiones: prev.conversiones + term.conversions,
          apariciones: prev.apariciones + 1,
        })
      }
    }
  }

  const resultado = Array.from(mapa.entries())
    .filter(([_, v]) => v.gasto >= MIN_GASTO_EUR)
    .map(([termino, v]) => ({
      termino,
      apariciones:      v.apariciones,
      gasto:            parseFloat(v.gasto.toFixed(2)),
      conversiones:     v.conversiones,
      sugeridaNegativa: v.conversiones === 0 && v.gasto >= GASTO_NEGATIVA,
    }))
    .sort((a, b) => {
      if (a.conversiones === 0 && b.conversiones > 0) return -1
      if (b.conversiones === 0 && a.conversiones > 0) return 1
      return b.gasto - a.gasto
    })
    .slice(0, MAX_RESULTADOS)

  const totalGastoSinConv = resultado
    .filter(n => n.conversiones === 0)
    .reduce((s, n) => s + n.gasto, 0)

  return {
    ngramas: resultado,
    totalGastoSinConv:    parseFloat(totalGastoSinConv.toFixed(2)),
    totalTermsAnalizados: searchTerms.length,
  }
}

module.exports = { analizar }
