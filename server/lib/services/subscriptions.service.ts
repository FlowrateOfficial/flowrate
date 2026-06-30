// ANCHOR: Detected subscriptions list service
import type { SubscriptionListItemDto } from '#shared/api/subscriptions'
import type { SubscriptionStatus } from '~~/generated/prisma/client'
import type { SpaceContext } from '../domain/context'

export interface SubscriptionListQuery {
  status?: string
  limit: number
}

export async function listSubscriptionsForSpace(
  ctx: SpaceContext,
  query: SubscriptionListQuery
): Promise<SubscriptionListItemDto[]> {
  const subs = await prisma.detectedSubscription.findMany({
    where: {
      spaceId: ctx.spaceId,
      ...(query.status ? { status: query.status as SubscriptionStatus } : {})
    },
    orderBy: { amount: 'desc' },
    take: query.limit
  })

  const nameCounts = subs.reduce<Record<string, number>>((acc, sub) => {
    const key = sub.name.toLowerCase()
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return subs.map(sub => ({
    id: sub.id,
    name: sub.name,
    amount: Number(sub.amount),
    currency: sub.currency,
    frequency: sub.frequency,
    status: sub.status,
    icon: sub.icon,
    lastCharge: sub.lastCharge?.toISOString() ?? null,
    nextCharge: sub.nextCharge?.toISOString() ?? null,
    alert: sub.alert,
    isDuplicate: (nameCounts[sub.name.toLowerCase()] ?? 0) > 1
  }))
}

export async function listAlertSubscriptionsForSpace(
  spaceId: string,
  limit: number
): Promise<SubscriptionListItemDto[]> {
  const subs = await prisma.detectedSubscription.findMany({
    where: { spaceId, status: 'PRICE_CHANGED' },
    orderBy: { amount: 'desc' },
    take: limit
  })

  const nameCounts = subs.reduce<Record<string, number>>((acc, sub) => {
    const key = sub.name.toLowerCase()
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return subs.map(sub => ({
    id: sub.id,
    name: sub.name,
    amount: Number(sub.amount),
    currency: sub.currency,
    frequency: sub.frequency,
    status: sub.status,
    icon: sub.icon,
    lastCharge: sub.lastCharge?.toISOString() ?? null,
    nextCharge: sub.nextCharge?.toISOString() ?? null,
    alert: sub.alert,
    isDuplicate: (nameCounts[sub.name.toLowerCase()] ?? 0) > 1
  }))
}
