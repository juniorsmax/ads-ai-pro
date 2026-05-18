const PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID

export function initClarity() {
  if (!PROJECT_ID || typeof window === 'undefined') return
  // Snippet oficial de Microsoft Clarity (minificado inline para evitar dependencias externas)
  ;(function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) }
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y)
  })(window, document, 'clarity', 'script', PROJECT_ID)
}

// Etiquetar al usuario identificado para cruzar con grabaciones
export function clarityIdentify(userId, sessionId, pageId, friendlyName) {
  if (typeof window?.clarity !== 'function') return
  window.clarity('identify', userId, sessionId ?? undefined, pageId ?? undefined, friendlyName ?? undefined)
}

// Enviar evento personalizado a Clarity (aparece en los filtros del dashboard)
export function clarityEvent(name) {
  if (typeof window?.clarity !== 'function') return
  window.clarity('event', name)
}

// Añadir metadatos a la sesión (ej: plan, cuentaId) — filtrables en Clarity
export function clarityTag(key, value) {
  if (typeof window?.clarity !== 'function') return
  window.clarity('set', key, String(value))
}
