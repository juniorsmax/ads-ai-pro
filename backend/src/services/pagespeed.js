const PAGESPEED_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

async function fetchStrategy(url, strategy) {
  const params = new URLSearchParams({ url, strategy })
  if (process.env.PAGESPEED_API_KEY) params.set('key', process.env.PAGESPEED_API_KEY)

  const res = await fetch(`${PAGESPEED_API}?${params}`, {
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`PageSpeed API ${res.status}: ${body.slice(0, 120)}`)
  }

  const data = await res.json()
  const score  = Math.round((data.lighthouseResult?.categories?.performance?.score ?? 0) * 100)
  const audits = data.lighthouseResult?.audits ?? {}

  return {
    puntuacion: score,
    lcp: audits['largest-contentful-paint']?.displayValue   ?? '—',
    fid: audits['total-blocking-time']?.displayValue        ?? '—',
    cls: audits['cumulative-layout-shift']?.displayValue    ?? '—',
    fcp: audits['first-contentful-paint']?.displayValue     ?? '—',
  }
}

function impactoQS(scoreMobile) {
  if (scoreMobile >= 90) return { impactoQS: 'positivo', mensajeQS: 'Excelente velocidad móvil. Tu landing page contribuye positivamente al Quality Score.' }
  if (scoreMobile >= 70) return { impactoQS: 'neutral',  mensajeQS: `Velocidad aceptable (${scoreMobile}/100). Mejorar a 90+ optimizaría tu Quality Score y reduciría el CPC.` }
  if (scoreMobile >= 50) return { impactoQS: 'negativo', mensajeQS: `Velocidad media (${scoreMobile}/100). Esto puede estar reduciendo tu Quality Score y aumentando el CPC un 10-20%.` }
  return { impactoQS: 'negativo', mensajeQS: `Velocidad baja (${scoreMobile}/100). Esto reduce significativamente tu Quality Score y puede aumentar el CPC hasta un 30%.` }
}

function recomendaciones(movil, escritorio) {
  const recs = []
  if (movil.puntuacion < 90)  recs.push('Optimiza imágenes con formato WebP y añade lazy loading para mejorar el LCP en móvil.')
  if (movil.puntuacion < 70)  recs.push('Elimina o difiere el JavaScript bloqueante para reducir el Total Blocking Time.')
  if (movil.puntuacion < 70)  recs.push('Usa un CDN para servir recursos estáticos (imágenes, CSS, JS) más cerca del usuario.')
  if (escritorio.puntuacion < 90) recs.push('Implementa caché de navegador con cabeceras Cache-Control para recursos estáticos.')
  if (movil.puntuacion < 50)  recs.push('URGENTE: El Time to First Byte es alto — optimiza el servidor o usa caché de página completa.')
  if (movil.puntuacion < 50)  recs.push('Considera crear una landing page ligera dedicada para campañas de pago.')
  return recs
}

async function analyzeUrl(url) {
  const [movil, escritorio] = await Promise.all([
    fetchStrategy(url, 'MOBILE'),
    fetchStrategy(url, 'DESKTOP'),
  ])

  return {
    movil,
    escritorio,
    ...impactoQS(movil.puntuacion),
    recomendaciones: recomendaciones(movil, escritorio),
  }
}

module.exports = { analyzeUrl }
