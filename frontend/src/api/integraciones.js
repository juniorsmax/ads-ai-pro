import { api } from './client'

export const getIntegraciones  = ()                       => api.get('/integraciones')
export const guardarTelegram   = (botToken, chatId)       => api.post('/integraciones/telegram', { botToken, chatId })
export const testTelegram      = ()                       => api.post('/integraciones/telegram/test')
export const guardarDiscord    = (webhookUrl)             => api.post('/integraciones/discord', { webhookUrl })
export const testDiscord       = ()                       => api.post('/integraciones/discord/test')
export const generarResumenSemanal = (cuentaId)           => api.post('/ai/resumen-semanal', { cuentaId })
