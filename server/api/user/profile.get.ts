import type { AppPlan } from '#shared/billing'
import { isAdminEmail } from '../../lib/admin'
import { requireSessionUser } from '../../lib/auth'
import { getUserBillingSnapshot } from '../../lib/billing'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const config = useRuntimeConfig(event)

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      phoneVerified: true,
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
    phoneVerified: profile.phoneVerified != null,
    plan: profile.plan as AppPlan,
    isAdmin: isAdminEmail(profile.email, config.adminEmails),
    billing: billing
      ? {
          customerId: billing.customerId,
          subscription: billing.subscription
            ? {
                status: billing.subscription.status,
                periodEnd: billing.subscription.periodEnd?.toISOString() ?? null,
                cancelAtEnd: billing.subscription.cancelAtEnd,
                planKey: billing.subscription.planKey,
                priceId: billing.subscription.priceId
              }
            : null
        }
      : null
  }
})
