const { GoogleAdsApi } = require('google-ads-api')

function getClient() {
  return new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  })
}

async function getCustomer(refreshToken, customerId) {
  const client = getClient()
  return client.Customer({
    customer_id: customerId,
    refresh_token: refreshToken,
    login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  })
}

// Devuelve KPIs agregados de los últimos 30 días
async function getAccountSummary(refreshToken, customerId) {
  const customer = await getCustomer(refreshToken, customerId)

  const [campaigns, accountMetrics] = await Promise.all([
    customer.query(`
      SELECT
        campaign.id, campaign.name, campaign.status,
        metrics.cost_micros, metrics.conversions,
        metrics.ctr, metrics.average_cpc,
        metrics.conversion_value, metrics.impressions, metrics.clicks
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
    `),
    customer.query(`
      SELECT
        metrics.cost_micros, metrics.conversions,
        metrics.conversion_value, metrics.clicks, metrics.impressions
      FROM customer
      WHERE segments.date DURING LAST_30_DAYS
    `),
  ])

  const totalCost = microsToEuros(accountMetrics[0]?.metrics?.cost_micros ?? 0)
  const totalConversions = accountMetrics[0]?.metrics?.conversions ?? 0
  const totalConvValue = accountMetrics[0]?.metrics?.conversion_value ?? 0

  return {
    dateRange: 'Últimos 30 días',
    totalCost,
    totalConversions,
    avgCPA: totalConversions > 0 ? totalCost / totalConversions : 0,
    overallROAS: totalCost > 0 ? totalConvValue / totalCost : 0,
    campaigns: campaigns.map(row => ({
      id: row.campaign.id,
      name: row.campaign.name,
      status: row.campaign.status.toLowerCase(),
      cost: microsToEuros(row.metrics.cost_micros),
      conversions: row.metrics.conversions,
      cpa: row.metrics.conversions > 0
        ? microsToEuros(row.metrics.cost_micros) / row.metrics.conversions
        : 0,
      ctr: row.metrics.ctr,
      avgCpc: microsToEuros(row.metrics.average_cpc),
      convValue: row.metrics.conversion_value,
      impressions: row.metrics.impressions,
      clicks: row.metrics.clicks,
    })),
    anomalies: [],
  }
}

// Keywords con CPA alto o bajo rendimiento
async function getProblemKeywords(refreshToken, customerId) {
  const customer = await getCustomer(refreshToken, customerId)

  const rows = await customer.query(`
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      metrics.cost_micros, metrics.conversions,
      metrics.ctr, metrics.quality_score, metrics.clicks
    FROM keyword_view
    WHERE segments.date DURING LAST_30_DAYS
      AND metrics.cost_micros > 5000000
      AND campaign.status = 'ENABLED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  `)

  return rows.map(row => ({
    text: row.ad_group_criterion.keyword.text,
    matchType: row.ad_group_criterion.keyword.match_type,
    cost: microsToEuros(row.metrics.cost_micros),
    conversions: row.metrics.conversions,
    cpa: row.metrics.conversions > 0
      ? microsToEuros(row.metrics.cost_micros) / row.metrics.conversions
      : 0,
    ctr: row.metrics.ctr,
    qualityScore: row.metrics.quality_score,
  }))
}

// Accessible customer IDs para el usuario autenticado
async function getAccessibleAccounts(refreshToken) {
  const client = getClient()
  const customer = client.Customer({
    customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    refresh_token: refreshToken,
  })
  return customer.listAccessibleCustomers()
}

// Métricas diarias de los últimos 30 días para el gráfico de rendimiento
async function getDailyMetrics(refreshToken, customerId) {
  const customer = await getCustomer(refreshToken, customerId)

  const rows = await customer.query(`
    SELECT
      segments.date,
      metrics.cost_micros,
      metrics.conversions,
      metrics.clicks,
      metrics.impressions
    FROM customer
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY segments.date ASC
  `)

  return rows.map(row => ({
    fecha: row.segments.date.slice(5),  // "MM-DD"
    gasto: parseFloat(microsToEuros(row.metrics.cost_micros).toFixed(2)),
    conversiones: row.metrics.conversions,
    clics: row.metrics.clicks,
    impresiones: row.metrics.impressions,
  }))
}

// Presupuesto mensual vs gasto actual por campaña (para pacing widget)
async function getCampaignsBudget(refreshToken, customerId) {
  const customer = await getCustomer(refreshToken, customerId)

  const rows = await customer.query(`
    SELECT
      campaign.id, campaign.name, campaign.status,
      campaign_budget.amount_micros,
      metrics.cost_micros
    FROM campaign
    WHERE segments.date DURING THIS_MONTH
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
  `)

  const now = new Date()
  const diasTotales = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const diasTranscurridos = now.getDate()

  const campaigns = rows.map(row => {
    const presupuestoMensual = microsToEuros(row.campaign_budget.amount_micros) * diasTotales
    const gastoActual = microsToEuros(row.metrics.cost_micros)
    const ritmoEsperado = presupuestoMensual > 0 ? (diasTranscurridos / diasTotales) : 0
    const ritmoActual = presupuestoMensual > 0 ? gastoActual / presupuestoMensual : 0

    let estado = 'ok'
    if (ritmoActual > ritmoEsperado * 1.2) estado = 'exceso'
    else if (ritmoActual < ritmoEsperado * 0.7) estado = 'bajo'

    return {
      id:                row.campaign.id,
      name:              row.campaign.name,
      status:            row.campaign.status.toLowerCase(),
      gastoActual:       parseFloat(gastoActual.toFixed(2)),
      presupuestoMensual: parseFloat(presupuestoMensual.toFixed(2)),
      ritmoEsperado:     parseFloat((ritmoEsperado * 100).toFixed(1)),
      ritmoActual:       parseFloat((ritmoActual * 100).toFixed(1)),
      estado,
    }
  })

  const gastoTotal = campaigns.reduce((s, c) => s + c.gastoActual, 0)
  const presupuestoTotal = campaigns.reduce((s, c) => s + c.presupuestoMensual, 0)

  return { campaigns, gastoTotal: parseFloat(gastoTotal.toFixed(2)), presupuestoTotal: parseFloat(presupuestoTotal.toFixed(2)), diasTranscurridos, diasTotales }
}

// Términos de búsqueda de los últimos 30 días (para análisis n-gram)
async function getSearchTermsReport(refreshToken, customerId) {
  const customer = await getCustomer(refreshToken, customerId)

  const rows = await customer.query(`
    SELECT
      search_term_view.search_term,
      metrics.cost_micros,
      metrics.conversions,
      metrics.clicks,
      metrics.impressions
    FROM search_term_view
    WHERE segments.date DURING LAST_30_DAYS
      AND metrics.cost_micros > 1000000
      AND search_term_view.status != 'EXCLUDED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 500
  `)

  return rows.map(row => ({
    searchTerm:   row.search_term_view.search_term,
    cost:         microsToEuros(row.metrics.cost_micros),
    conversions:  row.metrics.conversions,
    clicks:       row.metrics.clicks,
    impressions:  row.metrics.impressions,
  }))
}

// Anuncios agrupados por grupo de anuncios (para A/B tests)
async function getAdsPerAdGroup(refreshToken, customerId) {
  const customer = await getCustomer(refreshToken, customerId)

  const rows = await customer.query(`
    SELECT
      ad_group.id, ad_group.name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.status,
      metrics.impressions, metrics.clicks,
      metrics.conversions, metrics.cost_micros, metrics.ctr
    FROM ad_group_ad
    WHERE segments.date DURING LAST_30_DAYS
      AND ad_group_ad.status != 'REMOVED'
      AND campaign.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
    ORDER BY ad_group.id, metrics.impressions DESC
  `)

  // Agrupar por ad group y filtrar los que tengan ≥2 anuncios
  const grupos = new Map()
  for (const row of rows) {
    const groupId = row.ad_group.id
    if (!grupos.has(groupId)) {
      grupos.set(groupId, { id: groupId, nombre: row.ad_group.name, anuncios: [] })
    }
    const headlines = (row.ad_group_ad.ad.responsive_search_ad?.headlines ?? [])
      .slice(0, 3)
      .map(h => h.text)
      .join(' | ')

    grupos.get(groupId).anuncios.push({
      id:           row.ad_group_ad.ad.id,
      titular:      headlines || '(Anuncio sin titulares RSA)',
      status:       row.ad_group_ad.status.toLowerCase(),
      impresiones:  row.metrics.impressions,
      clics:        row.metrics.clicks,
      conversiones: row.metrics.conversions,
      ctr:          row.metrics.ctr,
      coste:        parseFloat(microsToEuros(row.metrics.cost_micros).toFixed(2)),
    })
  }

  return Array.from(grupos.values()).filter(g => g.anuncios.length >= 2)
}

// Snapshot de Quality Score por keyword (para el cron diario)
async function getQSSnapshot(refreshToken, customerId) {
  const customer = await getCustomer(refreshToken, customerId)

  const rows = await customer.query(`
    SELECT
      ad_group_criterion.keyword.text,
      ad_group_criterion.resource_name,
      metrics.quality_score,
      metrics.historical_creative_quality_score,
      metrics.historical_post_click_quality_score,
      metrics.historical_search_predicted_ctr
    FROM keyword_view
    WHERE campaign.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
      AND ad_group_criterion.status != 'REMOVED'
    ORDER BY metrics.quality_score DESC
    LIMIT 1000
  `)

  return rows.map(row => ({
    keywordText:           row.ad_group_criterion.keyword.text,
    keywordResourceName:   row.ad_group_criterion.resource_name,
    qualityScore:          row.metrics.quality_score,
    creativeQualityScore:  row.metrics.historical_creative_quality_score,
    postClickQualityScore: row.metrics.historical_post_click_quality_score,
    searchPredictedCtr:    row.metrics.historical_search_predicted_ctr,
  })).filter(k => k.qualityScore)
}

// Métricas de los últimos 14 días para el resumen semanal
async function get14DayMetrics(refreshToken, customerId) {
  const customer = await getCustomer(refreshToken, customerId)

  const rows = await customer.query(`
    SELECT
      segments.date,
      metrics.cost_micros,
      metrics.conversions,
      metrics.clicks,
      metrics.impressions
    FROM customer
    WHERE segments.date DURING LAST_14_DAYS
    ORDER BY segments.date ASC
  `)

  return rows.map(row => ({
    fecha:        row.segments.date.slice(5),
    gasto:        parseFloat(microsToEuros(row.metrics.cost_micros).toFixed(2)),
    conversiones: row.metrics.conversions,
    clics:        row.metrics.clicks,
    impresiones:  row.metrics.impressions,
  }))
}

const microsToEuros = (micros) => (micros ?? 0) / 1_000_000

module.exports = {
  getAccountSummary,
  getProblemKeywords,
  getDailyMetrics,
  getAccessibleAccounts,
  getCampaignsBudget,
  getSearchTermsReport,
  getAdsPerAdGroup,
  getQSSnapshot,
  get14DayMetrics,
}
