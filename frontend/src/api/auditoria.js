import { api } from './client'

export const getPacing       = (cuentaId) => api.get(`/auditoria/pacing/${cuentaId}`)
export const getQSHistorico  = (cuentaId) => api.get(`/auditoria/qs-historico/${cuentaId}`)
export const getNgramas      = (cuentaId) => api.get(`/auditoria/ngramas/${cuentaId}`)
export const getAbTests      = (cuentaId) => api.get(`/auditoria/abtests/${cuentaId}`)
export const getPageSpeed    = (url)      => api.post('/auditoria/pagespeed', { url })
export const getHealthScore  = (cuentaId) => api.post('/auditoria/health-score', { cuentaId })
export const getPendientes   = (cuentaId) => api.get(`/optimizer/pendientes/${cuentaId}`)
export const aprobarCambio   = (id)       => api.post(`/optimizer/aprobar/${id}`)
export const rechazarCambio  = (id)       => api.post(`/optimizer/rechazar/${id}`)
