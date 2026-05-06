import { api } from './client'

export const unirseWaitlist = ({ email, nombre, tipo }) =>
  api.post('/waitlist', { email, nombre, tipo })

export const getWaitlistCount = () => api.get('/waitlist/count')
