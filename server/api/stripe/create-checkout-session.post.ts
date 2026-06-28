import { z } from 'zod'
import { resolveStripePriceId } from '../../lib/billing'
import { ensureStripeCustomer, requireStripe, resolveHttpsBaseUrl } from '../../lib/stripe'

const bodySchema = z.object({
  planKey: z.string().optional().default('pro'),
  priceId: z.string().optional(),
  interval: z.enum(['month', 'year']).optional().default('month')
})

export default defineEventHandler(async (event) => {
  const authUser = await requireNeonAuth(event)
  const { config, stripe } = requireStripe(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  const priceId = await resolveStripePriceId(stripe, {
    planKey: body.planKey ?? 'pro',
    priceId: body.priceId,
    fallbackPriceId: config.stripePricePro || undefined,
    interval: body.interval
  })

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, email: true, name: true, activeSpaceId: true }
  })

  if (!dbUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const defaultSpace = await prisma.financialSpace.findFirst({
    where: { ownerId: authUser.id, type: 'INDEPENDENT' },
    select: { id: true }
  })

  const spaceId = dbUser.activeSpaceId ?? defaultSpace?.id ?? ''
  const customerId = await ensureStripeCustomer(stripe, dbUser, {
    userId: authUser.id,
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
    metadata: { userId: authUser.id, planKey: body.planKey ?? 'pro' },
    subscription_data: {
      metadata: { userId: authUser.id, planKey: body.planKey ?? 'pro' }
    }
  })

  if (!session.url) {
    throw createError({ statusCode: 500, message: 'Failed to create checkout session' })
  }

  return { url: session.url }
})
