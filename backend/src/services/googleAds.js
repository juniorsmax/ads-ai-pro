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

const microsToEuros = (micros) => (micros ?? 0) / 1_000_000

module.exports = { getAccountSummary, getProblemKeywords, getDailyMetrics, getAccessibleAccounts }
