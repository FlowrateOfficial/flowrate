// ANCHOR: Analytics overview — SQL aggregates with FX conversion
import type { TransactionCategory } from '~~/generated/prisma/client'
import { Prisma } from '~~/generated/prisma/client'
import type { SpaceContext } from '../domain/context'
import {
  buildCashFlowSeriesFromAggregates,
  monthKey,
  netWorthFromMonthlyTotals,
  rangeToDates,
  type AnalyticsRange
} from '../../utils/analytics'
import { resolveSpaceDisplayCurrency } from '../../utils/currency'
import { accountVisibilityFilter } from '../../utils/spaceAuth'
import { createFxConverter } from '../fx/converter'

export interface AnalyticsQueryContext {
  spaceId: string
  accountIds: string[]
  accounts: Array<{ balance: number, currency: string, createdAt: Date }>
  currency: string
}

export interface AnalyticsOverviewOptions {
  lite?: boolean
}

type CashFlowAggRow = {
  period: Date
  currency: string
  income: Prisma.Decimal
  spending: Prisma.Decimal
}

type MerchantAggRow = { name: string, currency: string, amount: Prisma.Decimal }
type MonthlyNetRow = { period: Date, currency: string, net: Prisma.Decimal }

function periodKey(date: Date, bucket: 'day' | 'month'): string {
  return bucket === 'month' ? monthKey(date) : date.toISOString().slice(0, 10)
}

export async function getAnalyticsOverview(
  ctx: AnalyticsQueryContext,
  range: AnalyticsRange,
  options: AnalyticsOverviewOptions = {}
) {
  const { from, to } = rangeToDates(range)
  const bucket = range === '12m' || range === '90d' ? 'month' : 'day'
  const fx = await createFxConverter(ctx.currency)
  const totalBalance = fx.sum(ctx.accounts.map(account => ({
    amount: account.balance,
    currency: account.currency
  })))

  if (!ctx.accountIds.length) {
    return {
      range,
      summary: {
        totalBalance: 0,
        income: 0,
        spending: 0,
        net: 0,
        savingsRate: 0,
        transactionCount: 0,
        linkedAccountCount: 0,
        currency: ctx.currency
      },
      cashFlow: buildCashFlowSeriesFromAggregates([], from, to, bucket),
      categories: [] as Array<{ category: TransactionCategory, amount: number }>,
      netWorth: options.lite ? [] : netWorthFromMonthlyTotals(totalBalance, [], from, to),
      topMerchants: [] as Array<{ name: string, amount: number }>
    }
  }

  const baseWhere = {
    spaceId: ctx.spaceId,
    accountId: { in: ctx.accountIds },
    date: { gte: from, lte: to }
  }

  const truncUnit = bucket === 'month' ? 'month' : 'day'

  const [incomeRows, spendingRows, txCount, categoryGroups, cashFlowRows] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['currency'],
      where: { ...baseWhere, amount: { gt: 0 } },
      _sum: { amount: true }
    }),
    prisma.transaction.groupBy({
      by: ['currency'],
      where: { ...baseWhere, amount: { lt: 0 } },
      _sum: { amount: true }
    }),
    prisma.transaction.count({ where: baseWhere }),
    prisma.transaction.groupBy({
      by: ['category', 'currency'],
      where: { ...baseWhere, amount: { lt: 0 } },
      _sum: { amount: true }
    }),
    prisma.$queryRaw<CashFlowAggRow[]>`
      SELECT DATE_TRUNC(${truncUnit}, date) AS period,
        currency,
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) AS spending
      FROM transactions
      WHERE "spaceId" = ${ctx.spaceId}
        AND "accountId" IN (${Prisma.join(ctx.accountIds)})
        AND date >= ${from}
        AND date <= ${to}
      GROUP BY 1, 2
      ORDER BY 1
    `
  ])

  const merchantRows = options.lite
    ? []
    : await prisma.$queryRaw<MerchantAggRow[]>`
        SELECT COALESCE(NULLIF(TRIM(merchant), ''), NULLIF(TRIM(description), ''), 'Unknown') AS name,
          currency,
          SUM(ABS(amount)) AS amount
        FROM transactions
        WHERE "spaceId" = ${ctx.spaceId}
          AND "accountId" IN (${Prisma.join(ctx.accountIds)})
          AND date >= ${from}
          AND date <= ${to}
          AND amount < 0
        GROUP BY 1, 2
        ORDER BY 3 DESC
        LIMIT 24
      `

  const monthlyNet = options.lite
    ? []
    : await prisma.$queryRaw<MonthlyNetRow[]>`
        SELECT DATE_TRUNC('month', date) AS period,
          currency,
          SUM(amount) AS net
        FROM transactions
        WHERE "spaceId" = ${ctx.spaceId}
          AND "accountId" IN (${Prisma.join(ctx.accountIds)})
          AND date >= ${from}
          AND date <= ${to}
        GROUP BY 1, 2
        ORDER BY 1
      `

  const income = fx.sum(incomeRows.map(row => ({
    amount: Number(row._sum.amount ?? 0),
    currency: row.currency
  })))
  const spending = fx.sum(spendingRows.map(row => ({
    amount: Math.abs(Number(row._sum.amount ?? 0)),
    currency: row.currency
  })))

  const categoryTotals = new Map<TransactionCategory, number>()
  for (const row of categoryGroups) {
    const converted = fx.convert(Math.abs(Number(row._sum.amount ?? 0)), row.currency)
    categoryTotals.set(row.category, (categoryTotals.get(row.category) ?? 0) + converted)
  }

  const categories = [...categoryTotals.entries()]
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)

  const cashFlowBuckets = new Map<string, { income: number, spending: number }>()
  for (const row of cashFlowRows) {
    const key = periodKey(row.period, bucket)
    const entry = cashFlowBuckets.get(key) ?? { income: 0, spending: 0 }
    entry.income += fx.convert(Number(row.income), row.currency)
    entry.spending += fx.convert(Number(row.spending), row.currency)
    cashFlowBuckets.set(key, entry)
  }

  const cashFlow = buildCashFlowSeriesFromAggregates(
    [...cashFlowBuckets.entries()].map(([period, values]) => ({
      period,
      income: Math.round(values.income * 100) / 100,
      spending: Math.round(values.spending * 100) / 100
    })),
    from,
    to,
    bucket
  )

  const merchantTotals = new Map<string, number>()
  for (const row of merchantRows) {
    const converted = fx.convert(Number(row.amount), row.currency)
    merchantTotals.set(row.name, (merchantTotals.get(row.name) ?? 0) + converted)
  }

  const topMerchants = [...merchantTotals.entries()]
    .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)

  const monthlyNetBuckets = new Map<string, number>()
  for (const row of monthlyNet) {
    const key = monthKey(row.period)
    const converted = fx.convert(Number(row.net), row.currency)
    monthlyNetBuckets.set(key, (monthlyNetBuckets.get(key) ?? 0) + converted)
  }

  const netWorth = options.lite
    ? []
    : netWorthFromMonthlyTotals(
        totalBalance,
        [...monthlyNetBuckets.entries()].map(([period, net]) => ({
          period,
          net: Math.round(net * 100) / 100
        })),
        from,
        to
      )

  return {
    range,
    summary: {
      totalBalance: Math.round(totalBalance * 100) / 100,
      income: Math.round(income * 100) / 100,
      spending: Math.round(spending * 100) / 100,
      net: Math.round((income - spending) * 100) / 100,
      savingsRate: income > 0 ? Math.round(((income - spending) / income) * 1000) / 10 : 0,
      transactionCount: txCount,
      linkedAccountCount: ctx.accountIds.length,
      currency: ctx.currency
    },
    cashFlow,
    categories,
    netWorth,
    topMerchants
  }
}

export async function getAnalyticsForSpace(
  ctx: SpaceContext,
  range: AnalyticsRange,
  locale: string,
  options: AnalyticsOverviewOptions = {}
) {
  const accounts = await prisma.account.findMany({
    where: { spaceId: ctx.spaceId, ...accountVisibilityFilter(ctx.userId, ctx.role) },
    select: { id: true, balance: true, currency: true, createdAt: true }
  })

  const currency = await resolveSpaceDisplayCurrency(ctx.spaceId, locale)

  return getAnalyticsOverview(
    {
      spaceId: ctx.spaceId,
      accountIds: accounts.map(account => account.id),
      accounts: accounts.map(account => ({
        balance: Number(account.balance),
        currency: account.currency,
        createdAt: account.createdAt
      })),
      currency
    },
    range,
    options
  )
}
