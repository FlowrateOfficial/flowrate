// ANCHOR: Child allowance jar payouts
import { ENUM } from '#shared/prisma-enums'

export async function processAllowancePayouts(spaceId: string) {
  const profiles = await prisma.childProfile.findMany({
    where: {
      spaceId,
      allowance: { not: null },
      frequency: { not: null }
    },
    include: { jars: true, member: true }
  })

  const now = new Date()

  for (const profile of profiles) {
    const amount = Number(profile.allowance)
    if (!amount || amount <= 0) continue

    const lastPaid = profile.updatedAt
    const due = isAllowanceDue(profile.frequency!, lastPaid, now)
    if (!due) continue

    const jar = profile.jars[0]
    if (!jar) continue

    await prisma.allowanceJar.update({
      where: { id: jar.id },
      data: { balance: { increment: amount } }
    })

    await prisma.childProfile.update({
      where: { id: profile.id },
      data: { updatedAt: now }
    })
  }
}

function isAllowanceDue(frequency: string, lastPaid: Date, now: Date): boolean {
  const ms = now.getTime() - lastPaid.getTime()
  const days = ms / (1000 * 60 * 60 * 24)
  if (frequency === ENUM.period.WEEKLY) return days >= 7
  if (frequency === ENUM.period.MONTHLY) return days >= 28
  if (frequency === ENUM.period.YEARLY) return days >= 365
  return false
}

export function checkSpendingLimit(
  limits: Record<string, number>,
  category: string,
  spent: number
): { exceeded: boolean, limit: number | null } {
  const limit = limits[category] ?? limits.ALL ?? null
  if (limit == null) return { exceeded: false, limit: null }
  return { exceeded: spent > limit, limit }
}
