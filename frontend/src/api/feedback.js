import { api } from './client'

export const enviarFeedback = ({ tipo, mensaje, nps, pagina, metadata }) =>
  api.post('/feedback', { tipo, mensaje, nps, pagina, metadata })
