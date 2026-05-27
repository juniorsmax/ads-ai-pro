const router = require('express').Router()
const auth = require('../middleware/auth')
const stripeService = require('../services/stripe')
const supabase = require('../services/supabase')
const analytics = require('../services/analytics')

// GET /api/billing/planes — lista de planes disponibles
router.get('/planes', (req, res) => {
  const planes = Object.entries(stripeService.PLANES).map(([key, p]) => ({
    key,
    nombre: p.nombre,
    precio: p.precio / 100,
    moneda: p.moneda,
    cuentasMax: p.cuentasMax,
    chatMensual: p.chatMensual,
    whiteLabelReportes: p.whiteLabelReportes ?? false,
    portalCliente: p.portalCliente ?? false,
  }))
  res.json(planes)
})

// POST /api/billing/checkout — iniciar sesión de pago Stripe
router.post('/checkout', auth, async (req, res) => {
  const { plan } = req.body
  if (!plan) return res.status(400).json({ error: 'plan requerido' })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('email')
    .eq('id', req.user.userId)
    .single()

  try {
    const session = await stripeService.createCheckoutSession(
      req.user.userId,
      usuario.email,
      plan,
      `${process.env.FRONTEND_URL}/billing?success=1`,
      `${process.env.FRONTEND_URL}/billing?cancel=1`
    )
    res.json({ url: session.url })
  } catch (err) {
    console.error('[Stripe checkout]', err.message)
    res.status(500).json({ error: 'Error creando sesión de pago' })
  }
})

// POST /api/billing/portal — portal de facturación Stripe
router.post('/portal', auth, async (req, res) => {
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('stripe_customer_id')
    .eq('id', req.user.userId)
    .single()

  if (!usuario?.stripe_customer_id) {
    return res.status(400).json({ error: 'No tienes una suscripción activa' })
  }

  try {
    const session = await stripeService.createPortalSession(
      usuario.stripe_customer_id,
      `${process.env.FRONTEND_URL}/billing`
    )
    res.json({ url: session.url })
  } catch (err) {
    console.error('[Stripe portal]', err.message)
    res.status(500).json({ error: 'Error accediendo al portal de facturación' })
  }
})

// POST /api/billing/webhook — eventos de Stripe (sin auth JWT, firma Stripe)
// express.raw() ya está aplicado globalmente en server.js para esta ruta
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event
    try {
      event = await stripeService.handleWebhook(req.body, sig)
    } catch (err) {
      console.error('[Stripe webhook]', err.message)
      return res.status(400).send(`Webhook error: ${err.message}`)
    }

    await processWebhookEvent(event)
    res.json({ received: true })
  }
)

async function processWebhookEvent(event) {
  const sub = event.data.object

  switch (event.type) {
    case 'checkout.session.completed': {
      const { usuarioId, planKey } = sub.metadata ?? {}
      if (!usuarioId) break
      await supabase.from('usuarios').update({
        plan: planKey,
        stripe_customer_id: sub.customer,
        stripe_subscription_id: sub.subscription,
      }).eq('id', usuarioId)
      analytics.subscriptionCreated(usuarioId, {
        plan: planKey,
        precioCents: sub.amount_total ?? 0,
      })
      console.log(`[Stripe] Plan ${planKey} activado para usuario ${usuarioId}`)
      break
    }
    case 'customer.subscription.updated': {
      const planKey = sub.metadata?.planKey
      const usuarioId = sub.metadata?.usuarioId
      if (!planKey || !usuarioId) break
      const { data: usuarioActual } = await supabase
        .from('usuarios')
        .select('plan')
        .eq('id', usuarioId)
        .single()
      await supabase.from('usuarios').update({
        plan: planKey,
        stripe_subscription_id: sub.id,
      }).eq('id', usuarioId)
      if (usuarioActual?.plan && usuarioActual.plan !== planKey) {
        analytics.subscriptionUpgraded(usuarioId, {
          planAnterior: usuarioActual.plan,
          planNuevo: planKey,
          precioCents: sub.plan?.amount ?? 0,
        })
      }
      break
    }
    case 'customer.subscription.deleted': {
      const usuarioId = sub.metadata?.usuarioId
      if (!usuarioId) break
      const { data: usuarioActual } = await supabase
        .from('usuarios')
        .select('plan')
        .eq('id', usuarioId)
        .single()
      await supabase.from('usuarios').update({
        plan: 'basico',
        stripe_subscription_id: null,
      }).eq('id', usuarioId)
      analytics.subscriptionCancelled(usuarioId, {
        plan: usuarioActual?.plan ?? 'desconocido',
      })
      console.log(`[Stripe] Suscripción cancelada para usuario ${usuarioId}`)
      break
    }
  }
}

module.exports = router
