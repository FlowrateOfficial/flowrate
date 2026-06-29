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
    select: { customerId: true }
  })
  return billing?.customerId ?? null
}

export async function setStripeCustomerId(userId: string, customerId: string) {
  await ensureBillingProfile(userId)
  await prisma.userBilling.update({
    where: { userId },
    data: { customerId }
  })
}

export async function clearStripeCustomerId(userId: string) {
  await prisma.userBilling.updateMany({
    where: { userId },
    data: { customerId: null }
  })
}

export async function findUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
  const billing = await prisma.userBilling.findUnique({
    where: { customerId },
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
        customerId: true,
        subscription: {
          select: {
            subId: true,
            priceId: true,
            planKey: true,
            status: true,
            periodEnd: true,
            cancelAtEnd: true
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
    customerId: billing?.customerId ?? null,
    subscription: billing?.subscription ?? null
  }
}
