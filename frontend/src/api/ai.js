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
