import type { AppPlan } from '#shared/billing'

export async function ensureBillingProfile(userId: string) {
  return prisma.userBilling.upsert({
    where: { userId },
    create: { userId },
    update: {}
  })
}

export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const billing = await prisma.userBilling.findUnique({
    where: { userId },
    select: { stripeCustomerId: true }
  })
  return billing?.stripeCustomerId ?? null
}

export async function setStripeCustomerId(userId: string, stripeCustomerId: string) {
  await ensureBillingProfile(userId)
  await prisma.userBilling.update({
    where: { userId },
    data: { stripeCustomerId }
  })
}

export async function clearStripeCustomerId(userId: string) {
  await prisma.userBilling.updateMany({
    where: { userId },
    data: { stripeCustomerId: null }
  })
}

export async function findUserIdByStripeCustomerId(stripeCustomerId: string): Promise<string | null> {
  const billing = await prisma.userBilling.findUnique({
    where: { stripeCustomerId },
    select: { userId: true }
  })
  return billing?.userId ?? null
}

export async function getUserPlan(userId: string): Promise<AppPlan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true }
  })
  return (user?.plan ?? 'FREE') as AppPlan
}

export async function setUserPlan(userId: string, plan: AppPlan) {
  await prisma.user.update({
    where: { id: userId },
    data: { plan: plan as never }
  })
}

export async function getUserBillingSnapshot(userId: string) {
  const [user, billing] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, email: true, name: true }
    }),
    prisma.userBilling.findUnique({
      where: { userId },
      select: {
        stripeCustomerId: true,
        subscription: {
          select: {
            stripeSubscriptionId: true,
            stripePriceId: true,
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true
          }
        }
      }
    })
  ])

  if (!user) return null

  return {
    plan: user.plan as AppPlan,
    email: user.email,
    name: user.name,
    stripeCustomerId: billing?.stripeCustomerId ?? null,
    subscription: billing?.subscription ?? null
  }
}
