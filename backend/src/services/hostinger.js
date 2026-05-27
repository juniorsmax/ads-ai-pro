const BASE = 'https://api.hostinger.com/v1'

async function hFetch(path, options = {}) {
  const token = process.env.HOSTINGER_API_TOKEN
  if (!token) throw new Error('HOSTINGER_API_TOKEN no configurado')

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    signal: AbortSignal.timeout(30_000),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw Object.assign(new Error(body.message ?? `Hostinger API ${res.status}`), { status: res.status })
  }
  return res.json()
}

const hostinger = {
  // Lista todos los VPS de la cuenta
  listVPS() {
    return hFetch('/vps/virtual-machines')
  },

  // Detalle completo de un VPS (estado, IP, plan, disco, RAM)
  getVPS(vpsId) {
    return hFetch(`/vps/virtual-machines/${vpsId}`)
  },

  // Métricas en tiempo real: CPU %, RAM %, red IN/OUT (bytes/s), disco %
  getMetrics(vpsId) {
    return hFetch(`/vps/virtual-machines/${vpsId}/metrics`)
  },

  // Historial de métricas para gráficas (últimas N horas)
  // period: 'hour' | 'day' | 'week'
  getMetricsHistory(vpsId, period = 'day') {
    return hFetch(`/vps/virtual-machines/${vpsId}/metrics/history?period=${period}`)
  },

  // Snapshots del VPS
  getSnapshots(vpsId) {
    return hFetch(`/vps/virtual-machines/${vpsId}/snapshots`)
  },

  // Reglas de firewall
  getFirewallRules(vpsId) {
    return hFetch(`/vps/virtual-machines/${vpsId}/firewall`)
  },
}

module.exports = hostinger
