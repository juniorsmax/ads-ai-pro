import { api } from './client'

export const getCompetitors = (cuentaId) => api.get(`/competitors/${cuentaId}`)
export const refreshCompetitors = (cuentaId) => api.post(`/competitors/${cuentaId}/refresh`, {})
