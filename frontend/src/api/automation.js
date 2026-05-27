import { api } from './client'

export const getAutomationPreview = (cuentaId) => api.get(`/automation/${cuentaId}/preview`)
export const executeAutomation    = (cuentaId) => api.post(`/automation/${cuentaId}/execute`)
export const getAutomationLog     = (cuentaId, page = 0) => api.get(`/automation/${cuentaId}/log?page=${page}`)
