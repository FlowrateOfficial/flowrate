import type { SpaceContext } from '../domain/context'
import { getDashboardStats } from './dashboard.service'
import { getAnalyticsOverview } from './analytics.service'
import { getAccountsForSpace } from './accounts.service'
import { planHasFeature } from '#shared/plan-limits'
import { userPlanForId } from '../billing/enforcement'
import { localeFromRequest } from '../../utils/currency'
import { resolveSpaceDisplayCurrency } from '../../utils/currency'
import type { H3Event } from 'h3'

async function getRecentTransactions(
  spaceId: string,
  visibleAccountIds: string[],
  userId: string,
  limit: number
) {
  if (!visibleAccountIds.length) {
    return { items: [], total: 0, page: 1, pages: 1 }
  }

  const where = {
    spaceId,
    accountId: { in: visibleAccountIds }
  }

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      select: {
        id: true,
        description: true,
        merchant: true,
        amount: true,
        currency: true,
        category: true,
        date: true,
        pending: true,
        account: { select: { id: true, name: true } }
      }
    }),
    prisma.transaction.count({ where })
  ])

  return {
    items: items.map(tx => ({
      id: tx.id,
      description: tx.description,
      merchant: tx.merchant,
      amount: Number(tx.amount),
      currency: tx.currency,
      category: tx.category,
      date: tx.date.toISOString(),
      pending: tx.pending,
      account: tx.account
    })),
    total,
    page: 1,
    pages: Math.max(1, Math.ceil(total / limit))
  }
}

async function getAlertSubscriptions(spaceId: string, limit: number) {
  const subs = await prisma.detectedSubscription.findMany({
    where: { spaceId, status: 'PRICE_CHANGED' },
    orderBy: { amount: 'desc' },
    take: limit
  })

  const nameCounts = subs.reduce<Record<string, number>>((acc, s) => {
    const key = s.name.toLowerCase()
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return subs.map(s => ({
    id: s.id,
    name: s.name,
    amount: Number(s.amount),
    currency: s.currency,
    frequency: s.frequency,
    status: s.status,
    icon: s.icon,
    lastCharge: s.lastCharge?.toISOString() ?? null,
    nextCharge: s.nextCharge?.toISOString() ?? null,
    alert: s.alert,
    isDuplicate: (nameCounts[s.name.toLowerCase()] ?? 0) > 1
  }))
}

export async function getDashboardOverview(ctx: SpaceContext, event: H3Event) {
  const plan = await userPlanForId(ctx.userId)
  const includeSaas = planHasFeature(plan, 'saasShield')
  const currency = await resolveSpaceDisplayCurrency(ctx.spaceId, localeFromRequest(event))

  const accountFilter = accountVisibilityFilter(ctx.userId, ctx.role)
  const visibleAccounts = await prisma.account.findMany({
    where: { spaceId: ctx.spaceId, ...accountFilter },
    select: { id: true, balance: true, createdAt: true }
  })
  const accountIds = visibleAccounts.map(a => a.id)

  const [stats, analytics, accounts, transactions, alertSubscriptions] = await Promise.all([
    getDashboardStats(ctx).then((s) => {
      if (!includeSaas) {
        return {
          ...s,
          burnRate: null,
          burnRateChange: null,
          runwayMonths: null,
          subscriptionAlerts: 0
        }
      }
      return s
    }),
    getAnalyticsOverview(
      {
        spaceId: ctx.spaceId,
        accountIds,
        accounts: visibleAccounts.map(a => ({
          balance: Number(a.balance),
          createdAt: a.createdAt
        })),
        currency
      },
      '30d',
      { lite: true }
    ),
    getAccountsForSpace(ctx, 'all'),
    getRecentTransactions(ctx.spaceId, accountIds, ctx.userId, 8),
    includeSaas ? getAlertSubscriptions(ctx.spaceId, 5) : Promise.resolve([])
  ])

  return {
    stats,
    analytics,
    transactions,
    accounts,
    alertSubscriptions
  }
}
