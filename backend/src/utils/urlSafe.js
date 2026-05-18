const { URL } = require('url')
const dns = require('dns').promises

// Rangos de IP privadas/reservadas — bloquear para prevenir SSRF
const PRIVATE_RANGES = [
  /^127\./,                    // loopback
  /^10\./,                     // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./, // RFC 1918
  /^192\.168\./,               // RFC 1918
  /^169\.254\./,               // link-local (AWS metadata, etc.)
  /^::1$/,                     // IPv6 loopback
  /^fc00:/i,                   // IPv6 ULA
  /^fe80:/i,                   // IPv6 link-local
  /^0\./,                      // Este host
]

function esIPPrivada(ip) {
  return PRIVATE_RANGES.some(r => r.test(ip))
}

// Valida que una URL sea pública y no apunte a servicios internos
async function validarURLPublica(rawUrl) {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('URL con formato inválido')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Solo se permiten URLs http:// o https://')
  }

  const hostname = parsed.hostname

  // Bloquear hostname = IP directamente
  if (/^[\d.]+$/.test(hostname) || /^[a-f0-9:]+$/i.test(hostname)) {
    if (esIPPrivada(hostname)) {
      throw new Error('URL apunta a una dirección IP privada o reservada')
    }
    return rawUrl
  }

  // Resolver el hostname y verificar que la IP sea pública
  try {
    const { address } = await dns.lookup(hostname)
    if (esIPPrivada(address)) {
      throw new Error('El dominio resuelve a una dirección IP privada o reservada')
    }
  } catch (err) {
    if (err.message.includes('privada') || err.message.includes('reservada')) throw err
    throw new Error('No se pudo resolver el dominio de la URL')
  }

  return rawUrl
}

module.exports = { validarURLPublica }
