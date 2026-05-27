const BASE = 'https://api.supermetrics.com/enterprise/v2'

async function smFetch(path, body) {
  const apiKey = process.env.SUPERMETRICS_API_KEY
  if (!apiKey) throw new Error('SUPERMETRICS_API_KEY no configurado')

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.message ?? `Supermetrics API ${res.status}`), { status: res.status })
  }
  return res.json()
}

// IDs de fuentes en Supermetrics
const DS = {
  GOOGLE_ADS:     'AW',
  FACEBOOK_ADS:   'FB',
  GOOGLE_ANALYTICS: 'GA4',
  LINKEDIN_ADS:   'LI',
  TIKTOK_ADS:     'TT',
}

const supermetrics = {
  // Datos de Google Ads via Supermetrics (alternativa/complemento a Google Ads API directa)
  getGoogleAds({ accountId, dateRange = 'last_30_days', fields }) {
    return smFetch('/query', {
      ds_id: DS.GOOGLE_ADS,
      ds_accounts: [accountId],
      date_range_type: dateRange,
      fields: fields ?? ['campaign_name', 'cost', 'clicks', 'conversions', 'ctr', 'average_cpc', 'roas'],
      settings: { report_currency: 'EUR' },
    })
  },

  // Facebook Ads — la fuente de datos más pedida junto a Google Ads
  getFacebookAds({ accountId, dateRange = 'last_30_days', fields }) {
    return smFetch('/query', {
      ds_id: DS.FACEBOOK_ADS,
      ds_accounts: [accountId],
      date_range_type: dateRange,
      fields: fields ?? ['campaign_name', 'spend', 'clicks', 'actions', 'ctr', 'cpc', 'roas'],
      settings: { report_currency: 'EUR' },
    })
  },

  // Google Analytics 4
  getGA4({ propertyId, dateRange = 'last_30_days', fields }) {
    return smFetch('/query', {
      ds_id: DS.GOOGLE_ANALYTICS,
      ds_accounts: [propertyId],
      date_range_type: dateRange,
      fields: fields ?? ['sessions', 'conversions', 'revenue', 'source_medium', 'bounce_rate'],
    })
  },

  // LinkedIn Ads
  getLinkedInAds({ accountId, dateRange = 'last_30_days' }) {
    return smFetch('/query', {
      ds_id: DS.LINKEDIN_ADS,
      ds_accounts: [accountId],
      date_range_type: dateRange,
      fields: ['campaign_name', 'spend', 'clicks', 'impressions', 'ctr', 'cpc'],
    })
  },

  // Vista multi-plataforma unificada — core del diferenciador
  // Lanza todas las consultas en paralelo, tolera fallos parciales
  async getMultiPlatformSummary({ accounts, dateRange = 'last_30_days' }) {
    const queries = []

    if (accounts.googleAds)    queries.push({ plataforma: 'google_ads',    fn: () => supermetrics.getGoogleAds({ accountId: accounts.googleAds, dateRange }) })
    if (accounts.facebookAds)  queries.push({ plataforma: 'facebook_ads',  fn: () => supermetrics.getFacebookAds({ accountId: accounts.facebookAds, dateRange }) })
    if (accounts.ga4)          queries.push({ plataforma: 'google_analytics', fn: () => supermetrics.getGA4({ propertyId: accounts.ga4, dateRange }) })
    if (accounts.linkedinAds)  queries.push({ plataforma: 'linkedin_ads',  fn: () => supermetrics.getLinkedInAds({ accountId: accounts.linkedinAds, dateRange }) })

    const results = await Promise.allSettled(queries.map(q => q.fn()))

    return queries.reduce((acc, q, i) => {
      const result = results[i]
      acc[q.plataforma] = result.status === 'fulfilled'
        ? { data: result.value, error: null }
        : { data: null, error: result.reason.message }
      return acc
    }, {})
  },
}

module.exports = supermetrics
