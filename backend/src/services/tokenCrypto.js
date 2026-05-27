const crypto = require('crypto')

const ALGORITHM = 'aes-256-gcm'
const SEP = ':'

function getKey() {
  const hex = process.env.TOKEN_ENCRYPTION_KEY ?? ''
  if (hex.length !== 64) {
    throw new Error('TOKEN_ENCRYPTION_KEY debe ser 64 caracteres hex (32 bytes). Genera con: openssl rand -hex 32')
  }
  return Buffer.from(hex, 'hex')
}

// Devuelve true si el valor ya está cifrado con nuestro formato iv:tag:ct
function isEncrypted(stored) {
  if (!stored) return false
  return stored.split(SEP).length === 3
}

// Cifra un token. Lanza si TOKEN_ENCRYPTION_KEY no está configurada.
function encrypt(plaintext) {
  if (!plaintext) return plaintext
  const key  = getKey()
  const iv   = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const ct   = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag  = cipher.getAuthTag()
  return `${iv.toString('hex')}${SEP}${tag.toString('hex')}${SEP}${ct.toString('hex')}`
}

// Descifra un token. Si el valor no tiene el formato cifrado (migración gradual),
// lo devuelve tal cual como texto plano sin lanzar error.
function decrypt(stored) {
  if (!stored) return null
  if (!isEncrypted(stored)) return stored  // texto plano — migración gradual
  try {
    const [ivHex, tagHex, ctHex] = stored.split(SEP)
    const key     = getKey()
    const iv      = Buffer.from(ivHex, 'hex')
    const tag     = Buffer.from(tagHex, 'hex')
    const ct      = Buffer.from(ctHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    return decipher.update(ct) + decipher.final('utf8')
  } catch {
    return stored
  }
}

module.exports = { encrypt, decrypt, isEncrypted }
