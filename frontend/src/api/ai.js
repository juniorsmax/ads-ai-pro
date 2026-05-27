import { api } from './client'

export const chatIA = (mensaje, historial, cuentaId) =>
  api.post('/ai/chat', { mensaje, historial, cuentaId })

export const analizarCuenta = (cuentaId) =>
  api.post('/ai/analyze', { cuentaId })

export const optimizarCuenta = (cuentaId, objetivos) =>
  api.post('/ai/optimize', { cuentaId, objetivos })

export const generarCopy = (tipo, keywords, perfilMarca, copiesActuales) =>
  api.post('/ai/copy', { tipo, keywords, perfilMarca, copiesActuales })

export const auditarCopies = (copies) =>
  api.post('/ai/copy/audit', { copies })

export const chequearAlertas = (cuentaId) =>
  api.post('/ai/alerts/check', { cuentaId })

export const getAlertas = (cuentaId) =>
  api.get(`/ai/alerts/${cuentaId}`)

export const getUsageIA = () =>
  api.get('/ai/usage')

// Streaming SSE: llama onEvent(eventName, data) por cada evento recibido
export async function chatIAStream(mensaje, historial, cuentaId, objetivos = {}, onEvent, { signal } = {}) {
  const token = localStorage.getItem('adsai_token')
  const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

  const res = await fetch(`${BASE_URL}/ai/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ mensaje, historial, cuentaId, objetivos }),
    signal,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Error en la petición')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    // Los eventos SSE están separados por línea en blanco (\n\n)
    const bloques = buffer.split('\n\n')
    buffer = bloques.pop() // el último puede estar incompleto

    for (const bloque of bloques) {
      if (!bloque.trim()) continue
      let eventName = null
      let dataLine = null
      for (const linea of bloque.split('\n')) {
        if (linea.startsWith('event: ')) eventName = linea.slice(7).trim()
        if (linea.startsWith('data: ')) dataLine = linea.slice(6)
      }
      if (eventName && dataLine) {
        try { onEvent(eventName, JSON.parse(dataLine)) } catch {}
      }
    }
  }
}

// ── Polling de jobs encolados ─────────────────────────────────────────────────

export const getJobResult = (jobId) =>
  api.get(`/ai/job/${jobId}`)

export async function waitForJob(jobId, { maxSegundos = 30, intervaloMs = 1500, onProgress } = {}) {
  const maxIntentos = Math.floor((maxSegundos * 1000) / intervaloMs)
  for (let i = 0; i < maxIntentos; i++) {
    if (onProgress) onProgress(i + 1)
    const resultado = await getJobResult(jobId)
    if (resultado.estado === 'completado') return resultado.resultado
    if (resultado.estado === 'fallido') throw new Error('El análisis falló. Inténtalo de nuevo.')
    await new Promise(r => setTimeout(r, intervaloMs))
  }
  throw new Error('Tiempo de espera agotado. El análisis tardó demasiado.')
}
