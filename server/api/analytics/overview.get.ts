import { z } from 'zod'
import {
  buildCashFlowSeries,
  netWorthHistory,
  rangeToDates,
  spendingByCategory,
  type AnalyticsRange
} from '../../utils/analytics'

const querySchema = z.object({
  range: z.enum(['7d', '30d', '90d', '12m']).default('30d')
})

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)
  const { range } = await getValidatedQuery(event, querySchema.parse)
  const { from, to } = rangeToDates(range as AnalyticsRange)

  const accountFilter = accountVisibilityFilter(user.id, membership.role)

  const accounts = await prisma.account.findMany({
    where: { spaceId: space.id, ...accountFilter },
    select: { id: true, balance: true, createdAt: true }
  })

  const accountIds = accounts.map(a => a.id)

  const txs = accountIds.length
    ? await prisma.transaction.findMany({
        where: {
          spaceId: space.id,
          accountId: { in: accountIds },
          date: { gte: from, lte: to }
        },
        select: { date: true, amount: true, category: true }
      })
    : []

  const normalized = txs.map(tx => ({
    date: tx.date,
    amount: Number(tx.amount),
    category: tx.category
  }))

  const spending = normalized.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const income = normalized.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const bucket = range === '12m' || range === '90d' ? 'month' : 'day'

  const accountBalances = accounts.map(a => ({
    balance: Number(a.balance),
    createdAt: a.createdAt
  }))

  return {
    range,
    summary: {
      totalBalance: accountBalances.reduce((s, a) => s + a.balance, 0),
      income: Math.round(income * 100) / 100,
      spending: Math.round(spending * 100) / 100,
      net: Math.round((income - spending) * 100) / 100,
      savingsRate: income > 0 ? Math.round(((income - spending) / income) * 1000) / 10 : 0,
      transactionCount: txs.length
    },
    cashFlow: buildCashFlowSeries(normalized, from, to, bucket),
    categories: spendingByCategory(normalized),
    netWorth: netWorthHistory(accountBalances, normalized, from, to),
    topMerchants: await topMerchants(space.id, from, to, accountFilter)
  }
})

async function topMerchants(
  spaceId: string,
  from: Date,
  to: Date,
  accountFilter: ReturnType<typeof accountVisibilityFilter>
) {
  const txs = await prisma.transaction.findMany({
    where: {
      spaceId,
      date: { gte: from, lte: to },
      amount: { lt: 0 },
      account: accountFilter
    },
    select: { merchant: true, description: true, amount: true }
  })

  const totals = new Map<string, number>()
  for (const tx of txs) {
    const key = tx.merchant ?? tx.description
    totals.set(key, (totals.get(key) ?? 0) + Math.abs(Number(tx.amount)))
  }

  return [...totals.entries()]
    .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
}
