const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PLANES = {
  basico: {
    nombre: 'Básico',
    precio: 2900, // céntimos
    moneda: 'eur',
    cuentasMax: 1,
    chatMensual: 50,
    whiteLabelReportes: false,
    priceId: process.env.STRIPE_PRICE_BASICO,
  },
  profesional: {
    nombre: 'Profesional',
    precio: 7900,
    moneda: 'eur',
    cuentasMax: 5,
    chatMensual: null, // ilimitado
    whiteLabelReportes: true,
    priceId: process.env.STRIPE_PRICE_PROFESIONAL,
  },
  agencia: {
    nombre: 'Agencia',
    precio: 19900,
    moneda: 'eur',
    cuentasMax: 25,
    chatMensual: null,
    whiteLabelReportes: true,
    portalCliente: true,
    urlPersonalizada: true,
    priceId: process.env.STRIPE_PRICE_AGENCIA,
  },
}

async function createCheckoutSession(usuarioId, email, planKey, successUrl, cancelUrl) {
  const plan = PLANES[planKey]
  if (!plan) throw new Error(`Plan desconocido: ${planKey}`)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { usuarioId, planKey },
    subscription_data: { metadata: { usuarioId, planKey } },
    locale: 'es',
  })

  return session
}

async function createPortalSession(stripeCustomerId, returnUrl) {
  return stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })
}

async function handleWebhook(payload, sig) {
  return stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  )
}

async function getSubscription(subscriptionId) {
  return stripe.subscriptions.retrieve(subscriptionId)
}

module.exports = { createCheckoutSession, createPortalSession, handleWebhook, getSubscription, PLANES }
