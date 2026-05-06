import { api } from './client'

export const chatIA = (mensaje, historial, cuentaId) =>
  api.post('/ai/chat', { mensaje, historial, cuentaId })

export const analizarCuenta = (cuentaId) =>
  api.post('/ai/analyze', { cuentaId })
