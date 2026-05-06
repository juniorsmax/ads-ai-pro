// Comprime datos crudos de Google Ads antes de enviarlos a Claude.
// Reduce de ~50.000 tokens a ~2.000 tokens por llamada.

function compressAccountData(rawData) {
  const campaigns = rawData.campaigns ?? []
  const keywords = rawData.keywords ?? []
  const avgCPA = rawData.avgCPA ?? 0

  return {
    periodo: rawData.dateRange,
    totalGasto: fmt(rawData.totalCost),
    totalConversiones: rawData.totalConversions ?? 0,
    cpaMedio: fmt(avgCPA),
    roas: rawData.overallROAS?.toFixed(2) ?? '—',
    topCampanas: campaigns
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
      .map(c => ({
        nombre: c.name,
        gasto: fmt(c.cost),
        conv: c.conversions ?? 0,
        cpa: fmt(c.cpa),
        ctr: pct(c.ctr),
        tendencia: c.trendVsLastPeriod ?? '—',
        estado: c.status,
      })),
    alertas: (rawData.anomalies ?? []).slice(0, 5),
    keywordsProblema: keywords
      .filter(k => k.cpa > avgCPA * 2 && k.cost > 0)
      .slice(0, 15)
      .map(k => ({
        texto: k.text,
        gasto: fmt(k.cost),
        conv: k.conversions ?? 0,
        cpa: fmt(k.cpa),
        qs: k.qualityScore ?? '—',
      })),
  }
}

function compressCampaignList(campaigns) {
  return campaigns.map(c => ({
    id: c.id,
    nombre: c.name,
    estado: c.status,
    gasto: fmt(c.cost),
    conv: c.conversions ?? 0,
    cpa: fmt(c.cpa),
    roas: c.roas?.toFixed(2) ?? '—',
    ctr: pct(c.ctr),
    cpc: fmt(c.avgCpc),
    tendencia: c.trendVsLastPeriod ?? '—',
  }))
}

const fmt = (v) => v != null ? `€${Number(v).toFixed(2)}` : '—'
const pct = (v) => v != null ? `${(v * 100).toFixed(2)}%` : '—'

module.exports = { compressAccountData, compressCampaignList }
