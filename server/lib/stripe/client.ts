import type { H3Event } from 'h3'
import Stripe from 'stripe'

export function getStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey)
}

export function requireStripe(event: H3Event) {
  const config = useRuntimeConfig(event)
  const secretKey = config.stripeSecretKey

  if (!secretKey) {
    throw createError({ statusCode: 503, message: 'Stripe is not configured' })
  }

  return {
    config,
    stripe: getStripeClient(secretKey)
  }
}

/** Financial Connections `return_url` must be HTTPS — omit on local HTTP dev. */
export function resolveHttpsBaseUrl(event: H3Event, appUrl: string): string | null {
  const candidates = [
    appUrl.replace(/\/$/, ''),
    getRequestURL(event).origin.replace(/\/$/, '')
  ]

  return candidates.find(url => url.startsWith('https://')) ?? null
}

export function extractStripeId(
  value: string | Stripe.Customer | Stripe.Subscription | Stripe.DeletedCustomer | null | undefined
): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}
