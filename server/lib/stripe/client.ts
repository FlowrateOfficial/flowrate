// ANCHOR: Stripe SDK client and HTTPS base URL helpers
import type { H3Event } from 'h3'
import Stripe from 'stripe'

export function getStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey)
}

function assertMatchingStripeKeyModes(secretKey: string, publishableKey: string | undefined) {
  if (!publishableKey) return

  const secretLive = secretKey.startsWith('sk_live_')
  const publishableLive = publishableKey.startsWith('pk_live_')
  const secretTest = secretKey.startsWith('sk_test_')
  const publishableTest = publishableKey.startsWith('pk_test_')

  if ((secretLive && !publishableLive) || (secretTest && !publishableTest)) {
    throw createError({
      statusCode: 503,
      message: 'Stripe publishable and secret keys must both be test or both be live.',
      data: { code: 'STRIPE_KEY_MISMATCH' }
    })
  }
}

export function requireStripe(event: H3Event) {
  const config = useRuntimeConfig(event)
  const secretKey = config.stripeSecretKey

  if (!secretKey) {
    throw createError({ statusCode: 503, message: 'Stripe is not configured' })
  }

  assertMatchingStripeKeyModes(secretKey, config.public.stripePublishableKey as string | undefined)

  return {
    config,
    stripe: getStripeClient(secretKey)
  }
}

// NOTE - Financial Connections return_url requires HTTPS — omit on local HTTP dev
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
