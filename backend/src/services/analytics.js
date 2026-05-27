const { PostHog } = require('posthog-node')

let _client = null

function getClient() {
  if (_client) return _client
  if (!process.env.POSTHOG_API_KEY) return null
  _client = new PostHog(process.env.POSTHOG_API_KEY, {
    host: process.env.POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    flushAt: 20,
    flushInterval: 10000,
  })
  return _client
}

function track(distinctId, event, props = {}) {
  const ph = getClient()
  if (!ph || !distinctId) return
  ph.capture({ distinctId, event, properties: { ...props, $lib: 'adsaipro-backend' } })
}

// ── Eventos del servidor ─────────────────────────────────────────────────────
// Los eventos de servidor son la fuente de verdad para conversiones y uso de IA.
// Los eventos de cliente (frontend) son complementarios para comportamiento UX.

const serverAnalytics = {
  // IA — registra cada llamada completada con métricas reales
  // Permite analizar: coste por agente, latencia, hit rate de caché, uso por plan
  aiAgentCompleted(userId, agente, { model, usage, latencyMs, cuentaId, fromCache = false }) {
    const tokensTotal = (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0)
    const cacheHit    = usage?.cache_read_input_tokens ?? 0

    // Estimación de coste según modelo (USD por 1M tokens de salida)
    const costMap = {
      'claude-sonnet-4-6': { in: 3.00, out: 15.00, cache: 0.30 },
      'claude-haiku-4-5':  { in: 0.25, out: 1.25,  cache: 0.03 },
    }
    const rates = costMap[model] ?? costMap['claude-sonnet-4-6']
    const costUsd = (
      ((usage?.input_tokens ?? 0) - cacheHit) * rates.in / 1_000_000 +
      (usage?.output_tokens ?? 0) * rates.out / 1_000_000 +
      cacheHit * rates.cache / 1_000_000
    )

    track(userId, 'ai_agent_completed', {
      agente,
      model,
      tokens_total: tokensTotal,
      tokens_input: usage?.input_tokens ?? 0,
      tokens_output: usage?.output_tokens ?? 0,
      tokens_cache_hit: cacheHit,
      cache_hit_pct: tokensTotal > 0 ? Math.round(cacheHit / tokensTotal * 100) : 0,
      latency_ms: latencyMs,
      cost_usd: parseFloat(costUsd.toFixed(6)),
      cuenta_id: cuentaId ?? null,
      from_cache: fromCache,
    })
  },

  // Alertas — evento clave para el embudo de correlación con campañas
  // Flujo a analizar en PostHog: alert_triggered → alert_viewed → [ai_chat_sent | campaign_viewed | (nada)]
  alertTriggered(userId, cuentaId, { tipo, gravedad, campanaId, metrica, valorActual, valorAnterior }) {
    track(userId, 'alert_triggered', {
      cuenta_id: cuentaId,
      tipo,
      gravedad,
      campana_id: campanaId ?? null,
      metrica,
      valor_actual: valorActual,
      valor_anterior: valorAnterior,
      variacion_pct: valorAnterior
        ? Math.round(((valorActual - valorAnterior) / valorAnterior) * 100)
        : null,
    })
  },

  // Google Ads sync
  googleAdsSynced(userId, cuentaId, { numCampanas, numKeywords, latencyMs }) {
    track(userId, 'google_ads_synced', {
      cuenta_id: cuentaId,
      num_campanas: numCampanas,
      num_keywords: numKeywords,
      latency_ms: latencyMs,
    })
  },

  // Stripe — fuente de verdad para conversiones de pago (no depender del cliente)
  subscriptionCreated(userId, { plan, precioCents, interval = 'month' }) {
    track(userId, 'subscription_created', { plan, precio_cents: precioCents, interval })
  },
  subscriptionUpgraded(userId, { planAnterior, planNuevo, precioCents }) {
    track(userId, 'subscription_upgraded', {
      plan_anterior: planAnterior,
      plan_nuevo: planNuevo,
      precio_cents: precioCents,
    })
  },
  subscriptionCancelled(userId, { plan, motivo }) {
    track(userId, 'subscription_cancelled', { plan, motivo: motivo ?? 'unknown' })
  },

  // Cierre limpio — llamar en SIGTERM para no perder eventos en buffer
  async shutdown() {
    if (_client) await _client.shutdown()
  },
}

module.exports = serverAnalytics
