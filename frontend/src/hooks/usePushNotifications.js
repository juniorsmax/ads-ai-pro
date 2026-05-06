import { useState, useEffect } from 'react'
import { getVapidPublicKey, subscribePush, unsubscribePush } from '../api/push'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [estado, setEstado] = useState('idle') // idle | solicitando | activo | denegado | no-soportado
  const [suscripcion, setSuscripcion] = useState(null)

  const soportado = 'serviceWorker' in navigator && 'PushManager' in window

  useEffect(() => {
    if (!soportado) { setEstado('no-soportado'); return }

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      if (sub) { setSuscripcion(sub); setEstado('activo') }
    })
  }, [soportado])

  async function activar() {
    if (!soportado) return
    setEstado('solicitando')
    try {
      const reg = await navigator.serviceWorker.ready
      const { publicKey } = await getVapidPublicKey()
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      await subscribePush(sub.toJSON())
      setSuscripcion(sub)
      setEstado('activo')
    } catch {
      setEstado(Notification.permission === 'denied' ? 'denegado' : 'idle')
    }
  }

  async function desactivar() {
    if (!suscripcion) return
    await suscripcion.unsubscribe()
    await unsubscribePush(suscripcion.endpoint)
    setSuscripcion(null)
    setEstado('idle')
  }

  return { estado, soportado, activar, desactivar }
}
