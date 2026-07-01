// ANCHOR: Stripe checkout + billing portal service
import type { H3Event } from 'h3'
import type { z } from 'zod'
import type { stripeCheckoutBodySchema } from '../schemas/api'
import { getStripeCustomerId, resolveStripePriceId } from '../billing'
import { billingCurrencyFromRequest } from '../../utils/currency'
import { ensureStripeCustomer, requireStripe, resolveHttpsBaseUrl } from '../stripe'
import { findDefaultIndependentSpaceId, findUserProfile } from '../repositories/user.repository'

type CheckoutBody = z.infer<typeof stripeCheckoutBodySchema>

async function billingSpaceId(userId: string, spaceId: string | null) {
  return spaceId ?? await findDefaultIndependentSpaceId(userId) ?? ''
}

export async function createStripeCheckoutSession(
  event: H3Event,
  authUserId: string,
  body: CheckoutBody
) {
  const { config, stripe } = requireStripe(event)

  const priceId = await resolveStripePriceId(stripe, {
    planKey: body.planKey ?? 'pro',
    priceId: body.priceId,
    fallbackPriceId: config.stripePricePro || undefined,
    interval: body.interval,
    currency: body.currency ?? billingCurrencyFromRequest(event)
  })

  const dbUser = await findUserProfile(authUserId)
  if (!dbUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const spaceId = await billingSpaceId(authUserId, dbUser.spaceId)
  const customerId = await ensureStripeCustomer(stripe, dbUser, {
    userId: authUserId,
    spaceId,
    visibility: 'PERSONAL'
  })

  const httpsBase = resolveHttpsBaseUrl(event, String(config.public.appUrl ?? ''))
  const base = httpsBase ?? getRequestURL(event).origin

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/dashboard/settings?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/dashboard/settings?canceled=1`,
    allow_promotion_codes: true,
    metadata: { userId: authUserId, planKey: body.planKey ?? 'pro' },
    subscription_data: {
      metadata: { userId: authUserId, planKey: body.planKey ?? 'pro' }
    }
  })

  if (!session.url) {
    throw createError({ statusCode: 500, message: 'Failed to create checkout session' })
  }

  return { url: session.url }
}

export async function createStripeBillingPortalSession(event: H3Event, userId: string) {
  const { config, stripe } = requireStripe(event)

  const dbUser = await findUserProfile(userId)
  if (!dbUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const spaceId = await billingSpaceId(userId, dbUser.spaceId)
  const customerId = await getStripeCustomerId(userId)
    ?? await ensureStripeCustomer(stripe, dbUser, {
      userId,
      spaceId,
      visibility: 'PERSONAL'
    })

  const httpsBase = resolveHttpsBaseUrl(event, String(config.public.appUrl ?? ''))
  const returnUrl = httpsBase
    ? `${httpsBase}/dashboard/settings`
    : `${getRequestURL(event).origin}/dashboard/settings`

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  })

  return { url: session.url }
}
