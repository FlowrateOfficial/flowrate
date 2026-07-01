import {
  constructStripeWebhookEvent,
  processStripeWebhookEvent
} from '../../lib/services/stripe-webhook.service'
import { requireStripe } from '../../lib/stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
    console.error(
      '[stripe/webhook] 503 — set STRIPE_WEBHOOK_SECRET in .env.dev (run `pnpm stripe:listen` and copy the whsec_… value), then restart `pnpm dev`.'
    )
    throw createError({ statusCode: 503, message: 'Stripe webhook secret is not configured' })
  }

  const { stripe } = requireStripe(event)
  const body = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')

  if (!body || !signature) {
    throw createError({ statusCode: 400, message: 'Missing body or signature' })
  }

  let stripeEvent
  try {
    stripeEvent = constructStripeWebhookEvent(
      stripe,
      body,
      signature,
      config.stripeWebhookSecret
    )
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid webhook signature' })
  }

  await processStripeWebhookEvent(stripe, stripeEvent)
  return { received: true }
})
