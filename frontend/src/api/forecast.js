import { api } from './client'

export const getForecast = (cuentaId) => api.get(`/forecast/${cuentaId}`)
