const supabase = require('./supabase')

// ── DB ────────────────────────────────────────────────────────────────────────

async function getConfig(usuarioId, tipo) {
  const { data } = await supabase
    .from('configuracion_integraciones')
    .select('config, activa')
    .eq('usuario_id', usuarioId)
    .eq('tipo', tipo)
    .maybeSingle()
  return data?.activa ? data.config : null
}

async function saveConfig(usuarioId, tipo, config) {
  await supabase
    .from('configuracion_integraciones')
    .upsert({
      usuario_id:     usuarioId,
      tipo,
      config,
      activa:         true,
      actualizado_en: new Date().toISOString(),
    }, { onConflict: 'usuario_id,tipo' })
}

async function getEstadoTodas(usuarioId) {
  const { data } = await supabase
    .from('configuracion_integraciones')
    .select('tipo, activa')
    .eq('usuario_id', usuarioId)

  const estado = {}
  for (const row of data ?? []) {
    estado[row.tipo] = row.activa
  }
  return estado
}

// ── Telegram Bot API ──────────────────────────────────────────────────────────

async function sendTelegram(botToken, chatId, texto) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'HTML' }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.description ?? `Telegram HTTP ${res.status}`)
  }
  return res.json()
}

// ── Discord Webhook ───────────────────────────────────────────────────────────

async function sendDiscord(webhookUrl, contenido, embeds = null) {
  const body = embeds
    ? { username: 'ADSAI PRO', embeds }
    : { username: 'ADSAI PRO', content: contenido }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok && res.status !== 204) throw new Error(`Discord HTTP ${res.status}`)
}

// ── Notificación multi-canal ──────────────────────────────────────────────────

async function notificarAlerta(usuarioId, titulo, mensaje) {
  const [telegram, discord] = await Promise.all([
    getConfig(usuarioId, 'telegram'),
    getConfig(usuarioId, 'discord'),
  ])

  const promises = []
  const textoTg = `<b>⚠ ${titulo}</b>\n\n${mensaje}`

  if (telegram?.botToken && telegram?.chatId) {
    promises.push(
      sendTelegram(telegram.botToken, telegram.chatId, textoTg)
        .catch(err => console.error('[Telegram alerta]', err.message))
    )
  }

  if (discord?.webhookUrl) {
    promises.push(
      sendDiscord(discord.webhookUrl, `⚠ **${titulo}**\n\n${mensaje}`)
        .catch(err => console.error('[Discord alerta]', err.message))
    )
  }

  await Promise.allSettled(promises)
}

module.exports = { getConfig, saveConfig, getEstadoTodas, sendTelegram, sendDiscord, notificarAlerta }
