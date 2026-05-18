const Anthropic = require('@anthropic-ai/sdk')
const client = new Anthropic()

// ── Checks programáticos (sin IA, deterministas) ──────────────────────────────

function chk(titulo, descripcion, estado, valor) {
  return { titulo, descripcion, estado, valor: valor != null ? String(valor) : undefined }
}

function evaluarCuenta(summary, keywords) {
  const camps   = summary.campaigns ?? []
  const kwds    = keywords ?? []
  const avgCPA  = summary.avgCPA ?? 0
  const totalConv  = summary.totalConversions ?? 0
  const totalCost  = summary.totalCost ?? 0
  const totalROAS  = summary.overallROAS ?? 0
  const ctrGlobal  = camps.length
    ? camps.reduce((s, c) => s + (c.ctr ?? 0), 0) / camps.length
    : 0

  // ── Keywords ───────────────────────────────────────────────────────────────
  const kwSinConv  = kwds.filter(k => k.conversions === 0 && k.cost > 20)
  const pctSinConv = kwds.length ? kwSinConv.length / kwds.length : 0
  const kwConQS    = kwds.filter(k => k.qualityScore)
  const qsMedio    = kwConQS.length
    ? kwConQS.reduce((s, k) => s + k.qualityScore, 0) / kwConQS.length
    : null
  const kwQSBajo = kwds.filter(k => k.qualityScore && k.qualityScore <= 3)

  const keywords_ = [
    chk('Keywords sin conversiones',
      `${kwSinConv.length} keywords con gasto >€20 y 0 conversiones`,
      pctSinConv > 0.3 ? 'error' : pctSinConv > 0.15 ? 'aviso' : 'ok',
      kwSinConv.length),
    chk('Quality Score medio',
      qsMedio ? `QS medio ${qsMedio.toFixed(1)}/10` : 'Sin datos de QS disponibles',
      !qsMedio ? 'aviso' : qsMedio >= 7 ? 'ok' : qsMedio >= 5 ? 'aviso' : 'error',
      qsMedio ? `${qsMedio.toFixed(1)}/10` : '—'),
    chk('Keywords con QS crítico (≤3)',
      kwQSBajo.length ? `${kwQSBajo.length} keywords con QS muy bajo` : 'Sin keywords con QS crítico',
      kwQSBajo.length > 5 ? 'error' : kwQSBajo.length > 0 ? 'aviso' : 'ok',
      kwQSBajo.length),
  ]

  // ── Anuncios ───────────────────────────────────────────────────────────────
  const campActivas = camps.filter(c => c.status === 'enabled' || c.status === 'activa')

  const anuncios = [
    chk('CTR global de campañas',
      `CTR medio ${(ctrGlobal * 100).toFixed(2)}%`,
      ctrGlobal < 0.01 ? 'error' : ctrGlobal < 0.02 ? 'aviso' : 'ok',
      `${(ctrGlobal * 100).toFixed(2)}%`),
    chk('Conversiones este mes',
      `${totalConv} conversiones en 30 días`,
      totalConv === 0 ? 'error' : totalConv < 5 ? 'aviso' : 'ok',
      totalConv),
    chk('Campañas activas',
      `${campActivas.length} de ${camps.length} campañas activas`,
      camps.length === 0 ? 'error' : campActivas.length === 0 ? 'aviso' : 'ok',
      `${campActivas.length}/${camps.length}`),
  ]

  // ── Presupuesto ────────────────────────────────────────────────────────────
  const cpasAltos = camps.filter(c => c.cpa > 0 && avgCPA > 0 && c.cpa > avgCPA * 3)

  const presupuesto = [
    chk('ROAS general',
      `ROAS ${totalROAS.toFixed(2)}x`,
      totalROAS < 1 ? 'error' : totalROAS < 2 ? 'aviso' : 'ok',
      `${totalROAS.toFixed(2)}x`),
    chk('Campañas con CPA excesivo',
      `${cpasAltos.length} campañas con CPA >3× la media`,
      cpasAltos.length > 2 ? 'error' : cpasAltos.length > 0 ? 'aviso' : 'ok',
      cpasAltos.length),
    chk('Gasto registrado este mes',
      totalCost > 0 ? `€${totalCost.toFixed(0)} en 30 días` : 'Sin gasto registrado — verifica la conexión',
      totalCost === 0 ? 'error' : totalCost < 50 ? 'aviso' : 'ok',
      `€${totalCost.toFixed(0)}`),
  ]

  // ── Calidad ────────────────────────────────────────────────────────────────
  const totalImpr = camps.reduce((s, c) => s + (c.impressions ?? 0), 0)

  const calidad = [
    chk('Seguimiento de conversiones',
      totalConv > 0 ? 'Tracking activo — se registran conversiones' : 'No se detectan conversiones — verifica el tracking',
      totalConv > 0 ? 'ok' : 'error',
      totalConv > 0 ? 'Activo' : 'Sin datos'),
    chk('CPA medio',
      avgCPA > 0 ? `CPA medio €${avgCPA.toFixed(2)}` : 'Sin conversiones para calcular CPA',
      avgCPA === 0 ? 'aviso' : 'ok',
      avgCPA > 0 ? `€${avgCPA.toFixed(2)}` : '—'),
    chk('Impresiones y alcance',
      `${totalImpr.toLocaleString('es-ES')} impresiones en 30 días`,
      totalImpr < 100 ? 'error' : totalImpr < 1000 ? 'aviso' : 'ok',
      null),
  ]

  const todos  = [...keywords_, ...anuncios, ...presupuesto, ...calidad]
  const puntos = todos.reduce((s, c) => s + (c.estado === 'ok' ? 1 : c.estado === 'aviso' ? 0.5 : 0), 0)

  return {
    score:      Math.round((puntos / todos.length) * 100),
    okCount:    todos.filter(c => c.estado === 'ok').length,
    avisoCount: todos.filter(c => c.estado === 'aviso').length,
    errorCount: todos.filter(c => c.estado === 'error').length,
    categorias: { Keywords: keywords_, Anuncios: anuncios, Presupuesto: presupuesto, Calidad: calidad },
  }
}

// ── Narrativa con Haiku (barato) ──────────────────────────────────────────────

async function generarNarrativa(score, okCount, avisoCount, errorCount, problemas) {
  const response = await client.messages.create({
    model:      process.env.CLAUDE_HAIKU ?? 'claude-haiku-4-5-20251001',
    max_tokens: 250,
    system: 'Eres un experto en Google Ads. Responde SOLO con JSON válido sin markdown: {"titulo":"...","resumen":"..."}. Máx 8 palabras en titulo, máx 2 frases en resumen. En español, directo y práctico.',
    messages: [{
      role:    'user',
      content: `Score ${score}/100. OK:${okCount} Avisos:${avisoCount} Errores:${errorCount}. Problemas: ${problemas.join('; ') || 'ninguno crítico'}`,
    }],
  })

  try {
    return JSON.parse(response.content[0].text)
  } catch {
    return {
      titulo:  score >= 80 ? 'Cuenta en buen estado' : score >= 60 ? 'Cuenta con margen de mejora' : 'Cuenta necesita atención urgente',
      resumen: `${errorCount} problemas críticos y ${avisoCount} avisos detectados. Revisa las recomendaciones por categoría.`,
    }
  }
}

// ── Export principal ──────────────────────────────────────────────────────────

async function analyze(accountSummary, keywords) {
  const resultado = evaluarCuenta(accountSummary, keywords)

  const topProblemas = Object.values(resultado.categorias)
    .flat()
    .filter(c => c.estado === 'error')
    .map(c => c.titulo)
    .slice(0, 3)

  const narrativa = await generarNarrativa(
    resultado.score,
    resultado.okCount,
    resultado.avisoCount,
    resultado.errorCount,
    topProblemas,
  )

  return { ...resultado, ...narrativa }
}

module.exports = { analyze }
