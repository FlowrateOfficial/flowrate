import type { AppPlan } from '#shared/billing'
import { requireAuthUser } from '../../lib/auth'
import { getUserBillingSnapshot } from '../../lib/billing'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      phoneVerifiedAt: true,
      plan: true
    }
  })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const billing = await getUserBillingSnapshot(user.id)

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    phoneVerified: profile.phoneVerifiedAt != null,
    plan: profile.plan as AppPlan,
    billing: billing
      ? {
          stripeCustomerId: billing.stripeCustomerId,
          subscription: billing.subscription
            ? {
                status: billing.subscription.status,
                currentPeriodEnd: billing.subscription.currentPeriodEnd?.toISOString() ?? null,
                cancelAtPeriodEnd: billing.subscription.cancelAtPeriodEnd
              }
            : null
        }
      : null
  }
})
