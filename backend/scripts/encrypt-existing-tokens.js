/**
 * Script de migración C-03: cifra los google_refresh_token en texto plano
 * que ya existen en la base de datos.
 *
 * Uso:
 *   cd backend
 *   node scripts/encrypt-existing-tokens.js
 *
 * Requisito: TOKEN_ENCRYPTION_KEY definida en backend/.env
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const supabase = require('../src/services/supabase')
const { encrypt, isEncrypted } = require('../src/services/tokenCrypto')

async function run() {
  console.log('Buscando usuarios con google_refresh_token en texto plano...')

  const { data: usuarios, error } = await supabase
    .from('usuarios')
    .select('id, google_refresh_token')
    .not('google_refresh_token', 'is', null)

  if (error) {
    console.error('Error leyendo usuarios:', error.message)
    process.exit(1)
  }

  const pendientes = (usuarios ?? []).filter(u => !isEncrypted(u.google_refresh_token))
  console.log(`Total usuarios con token: ${usuarios.length} | Sin cifrar: ${pendientes.length}`)

  if (!pendientes.length) {
    console.log('Todos los tokens ya están cifrados. Nada que hacer.')
    return
  }

  let ok = 0
  let err = 0
  for (const u of pendientes) {
    try {
      const enc = encrypt(u.google_refresh_token)
      const { error: updErr } = await supabase
        .from('usuarios')
        .update({ google_refresh_token: enc })
        .eq('id', u.id)
      if (updErr) throw updErr
      ok++
      console.log(`  ✓ ${u.id}`)
    } catch (e) {
      err++
      console.error(`  ✗ ${u.id}: ${e.message}`)
    }
  }

  console.log(`\nMigración completada: ${ok} cifrados, ${err} errores.`)
}

run().catch(console.error).finally(() => process.exit())
