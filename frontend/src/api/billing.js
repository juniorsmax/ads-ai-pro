import { api } from './client'

export const getPlanes = () => api.get('/billing/planes')
export const iniciarCheckout = (plan) => api.post('/billing/checkout', { plan })
export const abrirPortalStripe = () => api.post('/billing/portal')
