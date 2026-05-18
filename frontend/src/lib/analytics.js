import posthog from 'posthog-js'

const KEY  = import.meta.env.VITE_POSTHOG_KEY
const HOST = import.meta.env.VITE_POSTHOG_HOST ?? 'https://eu.i.posthog.com'

export function initPostHog() {
  if (!KEY) return
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,         // gestionamos manualmente con trackPage
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true },
    },
    loaded(ph) {
      if (import.meta.env.DEV) ph.debug()
    },
  })
}

export function identifyUser(userId, props = {}) {
  if (!KEY) return
  posthog.identify(userId, {
    email: props.email,
    plan: props.plan,
    created_at: props.createdAt,
    ...props,
  })
}

export function setUserPlan(plan) {
  if (!KEY) return
  posthog.people.set({ plan })
}

export function resetUser() {
  if (!KEY) return
  posthog.reset()
}

export function trackPage(path) {
  if (!KEY) return
  posthog.capture('$pageview', { $current_url: `${window.location.origin}${path}` })
}

function track(event, props = {}) {
  if (!KEY) return
  posthog.capture(event, props)
}

// ── Eventos de ADSAI PRO ────────────────────────────────────────────────────

export const analytics = {
  // Autenticación
  userSignedIn: (plan) =>
    track('user_signed_in', { plan }),
  userSignedOut: () => {
    track('user_signed_out')
    resetUser()
  },

  // Onboarding
  onboardingStarted: () => track('onboarding_started'),
  googleAdsLinked: (cuentaId) =>
    track('google_ads_account_linked', { cuenta_id: cuentaId }),

  // IA — chat y agentes
  // intent: 'analyze' | 'optimize' | 'copy' | 'general'
  aiChatSent: (intent, cuentaId) =>
    track('ai_chat_sent', { intent, cuenta_id: cuentaId }),
  aiAnalysisViewed: (cuentaId) =>
    track('ai_analysis_viewed', { cuenta_id: cuentaId }),
  aiOptimizerRun: (cuentaId) =>
    track('ai_optimizer_run', { cuenta_id: cuentaId }),
  aiCopyGenerated: (tipo) =>
    track('ai_copy_generated', { tipo }),
  aiCopyAudited: () =>
    track('ai_copy_audited'),

  // Alertas — punto clave para correlacionar comportamiento con campañas
  // El flujo: alerta disparada (backend) → usuario la ve (frontend) → usuario actúa
  alertViewed: (alertaId, tipo, gravedad, cuentaId) =>
    track('alert_viewed', { alerta_id: alertaId, tipo, gravedad, cuenta_id: cuentaId }),
  alertActioned: (alertaId, accion) =>
    track('alert_actioned', { alerta_id: alertaId, accion }),
  alertDismissed: (alertaId) =>
    track('alert_dismissed', { alerta_id: alertaId }),

  // Campañas
  campaignViewed: (campaignId, campaignName, status) =>
    track('campaign_viewed', { campaign_id: campaignId, campaign_name: campaignName, status }),
  campaignFiltered: (filtro) =>
    track('campaign_filtered', { filtro }),

  // Keywords
  keywordsFiltered: (filtro) =>
    track('keywords_filtered', { filtro }),
  keywordsPaused: (count) =>
    track('keywords_paused', { count }),

  // Competidores
  competitorsChecked: (cuentaId) =>
    track('competitors_checked', { cuenta_id: cuentaId }),

  // Reportes
  reportGenerated: (cuentaId, tipo) =>
    track('report_generated', { cuenta_id: cuentaId, tipo }),
  reportDownloaded: (formato) =>
    track('report_downloaded', { formato }),

  // Billing — fuente complementaria (servidor es la fuente de verdad)
  billingPageViewed: () => track('billing_page_viewed'),
  planSelected: (plan, precioCents) =>
    track('billing_plan_selected', { plan, precio_cents: precioCents }),
  checkoutStarted: (plan) =>
    track('checkout_started', { plan }),
}
