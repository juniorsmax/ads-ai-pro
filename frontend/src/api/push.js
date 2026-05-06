import { api } from './client'

export const getVapidPublicKey = () => api.get('/push/vapid-public-key')
export const subscribePush = (subscription) => api.post('/push/subscribe', { subscription })
export const unsubscribePush = (endpoint) => api.post('/push/unsubscribe', { endpoint })
export const testPush = () => api.post('/push/test', {})
