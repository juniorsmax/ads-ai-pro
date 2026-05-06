import { api } from './client'

export const getCampanas = (cuentaId) => api.get(`/campaigns/${cuentaId}`)
export const getDailyMetrics = (cuentaId) => api.get(`/campaigns/${cuentaId}/daily`)
