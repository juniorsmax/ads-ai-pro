import { api } from './client'

export const getKeywords = (cuentaId) => api.get(`/keywords/${cuentaId}`)
