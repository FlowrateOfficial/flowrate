import { requireStripe, resolveHttpsBaseUrl } from '../../lib/stripe'

export default defineEventHandler(async (event) => {
  const user = await requireNeonAuth(event)
  const { config, stripe } = requireStripe(event)

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true }
  })

  if (!dbUser?.stripeCustomerId) {
    throw createError({ statusCode: 400, message: 'No billing account found' })
  }

  const httpsBase = resolveHttpsBaseUrl(event, String(config.public.appUrl ?? ''))
  const returnUrl = httpsBase
    ? `${httpsBase}/dashboard/settings`
    : `${getRequestURL(event).origin}/dashboard/settings`

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: returnUrl
  })

  return { url: session.url }
})
