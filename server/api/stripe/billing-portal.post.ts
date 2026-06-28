import { getStripeCustomerId } from '../../lib/billing'
import { ensureStripeCustomer, requireStripe, resolveHttpsBaseUrl } from '../../lib/stripe'

export default defineEventHandler(async (event) => {
  const user = await requireNeonAuth(event)
  const { config, stripe } = requireStripe(event)

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, activeSpaceId: true }
  })

  if (!dbUser) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const defaultSpace = await prisma.financialSpace.findFirst({
    where: { ownerId: user.id, type: 'INDEPENDENT' },
    select: { id: true }
  })

  const spaceId = dbUser.activeSpaceId ?? defaultSpace?.id ?? ''
  const customerId = await getStripeCustomerId(user.id)
    ?? await ensureStripeCustomer(stripe, dbUser, {
      userId: user.id,
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
})
