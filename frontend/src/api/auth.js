import { api } from './client'
import { analytics } from '../lib/analytics'

export async function iniciarLoginGoogle() {
  const { url } = await api.get('/auth/google')
  window.location.href = url
}

export async function completarCallback(code) {
  const data = await api.post('/auth/callback', { code })
  if (data.token) {
    localStorage.setItem('adsai_token', data.token)
    localStorage.setItem('adsai_usuario', JSON.stringify(data.usuario))
  }
  return data
}

export function getUsuarioLocal() {
  const raw = localStorage.getItem('adsai_usuario')
  return raw ? JSON.parse(raw) : null
}

export function cerrarSesion() {
  analytics.userSignedOut()
  localStorage.removeItem('adsai_token')
  localStorage.removeItem('adsai_usuario')
  window.location.href = '/onboarding'
}

export function estaAutenticado() {
  return !!localStorage.getItem('adsai_token')
}
