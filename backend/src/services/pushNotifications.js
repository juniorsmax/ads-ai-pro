const webpush = require('web-push')
const supabase = require('./supabase')

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? 'admin@adsaipro.com'}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

async function subscribe(usuarioId, subscription) {
  await supabase.from('push_subscriptions').upsert({
    usuario_id: usuarioId,
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    activa: true,
  }, { onConflict: 'endpoint' })
}

async function unsubscribe(endpoint) {
  await supabase.from('push_subscriptions')
    .update({ activa: false })
    .eq('endpoint', endpoint)
}

async function sendToUser(usuarioId, payload) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys')
    .eq('usuario_id', usuarioId)
    .eq('activa', true)

  if (!subs?.length) return

  const mensaje = JSON.stringify({
    title: payload.title ?? 'ADSAI PRO',
    body: payload.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data ?? {},
    tag: payload.tag ?? 'adsai-alerta',
  })

  const resultados = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, mensaje)
        .catch(async err => {
          // Suscripción expirada — desactivar
          if (err.statusCode === 410) await unsubscribe(sub.endpoint)
          throw err
        })
    )
  )

  const enviadas = resultados.filter(r => r.status === 'fulfilled').length
  console.log(`[Push] ${enviadas}/${subs.length} notificaciones enviadas a usuario ${usuarioId}`)
  return enviadas
}

async function sendAlertCritica(usuarioId, cuentaNombre, alerta) {
  return sendToUser(usuarioId, {
    title: `⚠ Alerta crítica — ${cuentaNombre}`,
    body: alerta.mensaje ?? alerta,
    tag: 'adsai-critico',
    data: { url: '/dashboard', tipo: 'alerta_critica' },
  })
}

module.exports = { subscribe, unsubscribe, sendToUser, sendAlertCritica }
