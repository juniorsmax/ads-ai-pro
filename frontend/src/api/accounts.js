import { api } from './client'

export const getCuentas = () => api.get('/accounts')
export const getCuentasAccesibles = () => api.get('/accounts/accessible')
export const vincularCuenta = (customerId, nombre) => api.post('/accounts/link', { customerId, nombre })
export const getResumenCuenta = (id) => api.get(`/accounts/${id}/summary`)
