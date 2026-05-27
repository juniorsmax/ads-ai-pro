const router = require('express').Router()
const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')
const supabase = require('../services/supabase')
const { authCallback } = require('../middleware/validators')
const { encrypt } = require('../services/tokenCrypto')

const oauthClient = new OAuth2Client(
  process.env.GOOGLE_ADS_CLIENT_ID,
  process.env.GOOGLE_ADS_CLIENT_SECRET,
  `${process.env.FRONTEND_URL}/auth/callback`
)

const SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

// GET /api/auth/google — devuelve la URL de autorización de Google
router.get('/google', (req, res) => {
  const url = oauthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
  res.json({ url })
})

// POST /api/auth/callback — intercambia código por tokens y crea sesión
router.post('/callback', authCallback, async (req, res) => {
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'Código de autorización requerido' })

  try {
    const { tokens } = await oauthClient.getToken(code)
    oauthClient.setCredentials(tokens)

    // Obtener info del usuario
    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_ADS_CLIENT_ID,
    })
    const payload = ticket.getPayload()

    // Guardar o actualizar usuario en Supabase
    // Google solo devuelve refresh_token en el primer consentimiento —
    // si es null no sobrescribimos el token existente
    const datosUpsert = {
      google_id: payload.sub,
      email: payload.email,
      nombre: payload.name,
      avatar: payload.picture,
      actualizado_en: new Date().toISOString(),
    }
    if (tokens.refresh_token) {
      datosUpsert.google_refresh_token = encrypt(tokens.refresh_token)
    }

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .upsert(datosUpsert, { onConflict: 'google_id' })
      .select()
      .single()

    if (error) throw error

    // Crear JWT propio
    const token = jwt.sign(
      { userId: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, avatar: usuario.avatar } })
  } catch (err) {
    console.error('[Auth callback]', err.message)
    res.status(500).json({ error: 'Error en autenticación con Google' })
  }
})

// GET /api/auth/me — devuelve el usuario autenticado
router.get('/me', require('../middleware/auth'), async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, email, nombre, avatar, plan, creado_en')
    .eq('id', req.user.userId)
    .single()

  if (error) return res.status(404).json({ error: 'Usuario no encontrado' })
  res.json(data)
})

module.exports = router
