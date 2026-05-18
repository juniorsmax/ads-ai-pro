const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic()

// Escapa todos los caracteres HTML peligrosos — previene XSS en el template de reporte
function esc(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const SYSTEM_NARRATIVA = `Eres el redactor de reportes ejecutivos de ADSAI PRO. Escribes para clientes finales que NO son expertos en Google Ads.

Normas:
- Lenguaje claro, sin jerga técnica
- Tono positivo pero honesto
- Destaca los 3 mejores logros del período
- Lista los 3 próximos pasos concretos
- Máximo 250 palabras en total
- Siempre en español
- Formato: dos secciones claramente separadas: "Lo que conseguimos" y "Próximos pasos"`

const SYSTEM_ESTRUCTURA = `Eres un asistente que organiza datos de Google Ads en formato estructurado JSON para reportes.
Responde SOLO con JSON válido. Sin texto adicional.`

async function generateReport({ accountSummary, perfilAgencia, periodo }) {
  // Haiku para estructura de datos (barato)
  const estructuraRes = await client.messages.create({
    model: process.env.CLAUDE_HAIKU ?? 'claude-haiku-4-5',
    max_tokens: 800,
    system: SYSTEM_ESTRUCTURA,
    messages: [{
      role: 'user',
      content: `Organiza estos datos en JSON para un reporte. Campos: kpis (array con nombre/valor/cambio), topCampanas (top 3 por conversiones), alertas (máx 3 problemas):
${JSON.stringify(accountSummary)}`,
    }],
  })

  let estructurado = {}
  try {
    const match = estructuraRes.content[0].text.match(/\{[\s\S]*\}/)
    estructurado = match ? JSON.parse(match[0]) : {}
  } catch { /* usar vacío */ }

  // Sonnet para narrativa ejecutiva (calidad)
  const narrativaRes = await client.messages.create({
    model: process.env.CLAUDE_SONNET ?? 'claude-sonnet-4-6',
    max_tokens: 500,
    system: SYSTEM_NARRATIVA,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Período: ${periodo}\nDatos de la cuenta:\n${JSON.stringify(accountSummary, null, 2)}`,
          cache_control: { type: 'ephemeral' },
        },
      ],
    }],
  })

  return {
    periodo,
    estructurado,
    narrativa: narrativaRes.content[0].text,
    perfilAgencia,
    generadoEn: new Date().toISOString(),
  }
}

function renderHTML(reporte) {
  const { periodo, estructurado, narrativa, perfilAgencia } = reporte
  const { kpis = [], topCampanas = [], alertas = [] } = estructurado

  // Campos de agencia — snake_case desde la DB, con fallbacks seguros
  const agenciaNombre    = esc(perfilAgencia?.nombre ?? perfilAgencia?.nombre ?? 'Mi Agencia')
  const agenciaColor     = /^#[0-9A-Fa-f]{6}$/.test(perfilAgencia?.color_primario ?? '') ? perfilAgencia.color_primario : '#1B3A6B'
  const agenciaLogoUrl   = perfilAgencia?.logo_url ?? null
  const agenciaEmail     = esc(perfilAgencia?.email ?? '')

  // El src del logo se valida como URL https — evita javascript: y data: URIs
  const logoHTML = agenciaLogoUrl && /^https:\/\/.+/.test(agenciaLogoUrl)
    ? `<img src="${esc(agenciaLogoUrl)}" alt="${agenciaNombre}" style="height:48px; object-fit:contain;">`
    : `<span style="font-size:22px; font-weight:700; color:${agenciaColor};">${agenciaNombre}</span>`

  const kpisHTML = kpis.map(k => {
    const nombre = esc(k.nombre)
    const valor  = esc(k.valor)
    const cambio = esc(k.cambio)
    const color  = cambio.startsWith('+') ? '#22c55e' : '#ef4444'
    return `
    <div style="background:#f8fafc; border-radius:10px; padding:16px; text-align:center; min-width:120px;">
      <div style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">${nombre}</div>
      <div style="font-size:22px; font-weight:700; color:#1e293b;">${valor}</div>
      ${cambio ? `<div style="font-size:11px; color:${color};">${cambio} vs anterior</div>` : ''}
    </div>`
  }).join('')

  const campanaFilas = topCampanas.map(c => `
    <tr>
      <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0;">${esc(c.nombre ?? c.name ?? '—')}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; text-align:right;">${esc(c.gasto ?? c.cost ?? '—')}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; text-align:right;">${esc(c.conversiones ?? c.conversions ?? '—')}</td>
      <td style="padding:10px 12px; border-bottom:1px solid #e2e8f0; text-align:right;">${esc(c.cpa ?? '—')}</td>
    </tr>`).join('')

  const alertasHTML = alertas.length > 0
    ? alertas.map(a => `<li style="margin-bottom:6px; color:#64748b;">${esc(typeof a === 'string' ? a : a.mensaje ?? '')}</li>`).join('')
    : '<li style="color:#64748b;">Sin alertas este período</li>'

  // La narrativa de la IA se escapa completamente — no puede contener HTML
  const narrativaParrafos = narrativa
    .split('\n')
    .filter(l => l.trim())
    .map(l => {
      const limpio = esc(l.replace(/^[#*\s]+/, '').trim())
      return l.startsWith('#') || l.startsWith('**')
        ? `<h3 style="font-size:15px; font-weight:600; color:#1e293b; margin:18px 0 8px;">${limpio}</h3>`
        : `<p style="color:#475569; line-height:1.7; margin:0 0 10px;">${limpio}</p>`
    })
    .join('')

  const periodoEsc = esc(periodo)
  const fechaGen   = new Date().toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https:; script-src 'unsafe-inline';">
  <title>Reporte — ${periodoEsc}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, 'Segoe UI', sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div class="no-print" style="position:fixed; top:16px; right:16px; z-index:100;">
    <button onclick="window.print()" style="background:#1B3A6B; color:#fff; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-size:14px;">
      Exportar PDF
    </button>
  </div>

  <div style="max-width:800px; margin:0 auto; padding:48px 32px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px; padding-bottom:24px; border-bottom:2px solid ${agenciaColor};">
      <div>${logoHTML}</div>
      <div style="text-align:right;">
        <div style="font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:1px;">Reporte de rendimiento</div>
        <div style="font-size:16px; font-weight:600; color:#1e293b; margin-top:4px;">${periodoEsc}</div>
        <div style="font-size:11px; color:#94a3b8; margin-top:2px;">Generado el ${fechaGen}</div>
      </div>
    </div>

    ${kpisHTML ? `
    <div style="margin-bottom:36px;">
      <h2 style="font-size:13px; text-transform:uppercase; letter-spacing:1.5px; color:#64748b; margin:0 0 16px;">Resultados del período</h2>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">${kpisHTML}</div>
    </div>` : ''}

    <div style="background:#f0f7ff; border-left:4px solid ${agenciaColor}; border-radius:0 10px 10px 0; padding:24px; margin-bottom:36px;">
      ${narrativaParrafos}
    </div>

    ${campanaFilas ? `
    <div style="margin-bottom:36px;">
      <h2 style="font-size:13px; text-transform:uppercase; letter-spacing:1.5px; color:#64748b; margin:0 0 16px;">Campañas principales</h2>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600;">Campaña</th>
            <th style="padding:10px 12px; text-align:right; font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600;">Gasto</th>
            <th style="padding:10px 12px; text-align:right; font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600;">Conv.</th>
            <th style="padding:10px 12px; text-align:right; font-size:11px; text-transform:uppercase; color:#64748b; font-weight:600;">CPA</th>
          </tr>
        </thead>
        <tbody>${campanaFilas}</tbody>
      </table>
    </div>` : ''}

    <div style="margin-bottom:36px;">
      <h2 style="font-size:13px; text-transform:uppercase; letter-spacing:1.5px; color:#64748b; margin:0 0 16px;">Puntos de atención</h2>
      <ul style="margin:0; padding-left:20px; line-height:1.8;">${alertasHTML}</ul>
    </div>

    <div style="border-top:1px solid #e2e8f0; padding-top:20px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:12px; color:#94a3b8;">${agenciaNombre} · Powered by ADSAI PRO</span>
      <span style="font-size:12px; color:#94a3b8;">${agenciaEmail}</span>
    </div>
  </div>
</body>
</html>`
}

module.exports = { generateReport, renderHTML }
