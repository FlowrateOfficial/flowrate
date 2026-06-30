// ANCHOR: Analytics overview — SQL aggregates for cash flow, merchants, net worth
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

export interface AnalyticsQueryContext {
  spaceId: string
  accountIds: string[]
  accounts: Array<{ balance: number, createdAt: Date }>
  currency: string
}

export interface AnalyticsOverviewOptions {
  // NOTE - Skip net worth + top merchants (dashboard home)
  lite?: boolean
}

type CashFlowAggRow = { period: Date, income: Prisma.Decimal, spending: Prisma.Decimal }
type MerchantAggRow = { name: string, amount: Prisma.Decimal }
type MonthlyNetRow = { period: Date, net: Prisma.Decimal }

export async function getAnalyticsOverview(
  ctx: AnalyticsQueryContext,
  range: AnalyticsRange,
  options: AnalyticsOverviewOptions = {}
) {
  const { from, to } = rangeToDates(range)
  const bucket = range === '12m' || range === '90d' ? 'month' : 'day'
  const totalBalance = ctx.accounts.reduce((sum, a) => sum + a.balance, 0)

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

  const [incomeAgg, spendingAgg, txCount, categoryGroups, cashFlowRows] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...baseWhere, amount: { gt: 0 } },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { ...baseWhere, amount: { lt: 0 } },
      _sum: { amount: true }
    }),
    prisma.transaction.count({ where: baseWhere }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: { ...baseWhere, amount: { lt: 0 } },
      _sum: { amount: true }
    }),
    prisma.$queryRaw<CashFlowAggRow[]>`
      SELECT DATE_TRUNC(${truncUnit}, date) AS period,
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) AS spending
      FROM transactions
      WHERE "spaceId" = ${ctx.spaceId}
        AND "accountId" IN (${Prisma.join(ctx.accountIds)})
        AND date >= ${from}
        AND date <= ${to}
      GROUP BY 1
      ORDER BY 1
    `
  ])

  const merchantRows = options.lite
    ? []
    : await prisma.$queryRaw<MerchantAggRow[]>`
        SELECT COALESCE(NULLIF(TRIM(merchant), ''), NULLIF(TRIM(description), ''), 'Unknown') AS name,
          SUM(ABS(amount)) AS amount
        FROM transactions
        WHERE "spaceId" = ${ctx.spaceId}
          AND "accountId" IN (${Prisma.join(ctx.accountIds)})
          AND date >= ${from}
          AND date <= ${to}
          AND amount < 0
        GROUP BY 1
        ORDER BY 2 DESC
        LIMIT 8
      `

  const monthlyNet = options.lite
    ? []
    : await prisma.$queryRaw<MonthlyNetRow[]>`
        SELECT DATE_TRUNC('month', date) AS period,
          SUM(amount) AS net
        FROM transactions
        WHERE "spaceId" = ${ctx.spaceId}
          AND "accountId" IN (${Prisma.join(ctx.accountIds)})
          AND date >= ${from}
          AND date <= ${to}
        GROUP BY 1
        ORDER BY 1
      `

  const income = Number(incomeAgg._sum.amount ?? 0)
  const spending = Math.abs(Number(spendingAgg._sum.amount ?? 0))

  const categories = categoryGroups
    .map(row => ({
      category: row.category,
      amount: Math.round(Math.abs(Number(row._sum.amount ?? 0)) * 100) / 100
    }))
    .sort((a, b) => b.amount - a.amount)

  const cashFlow = buildCashFlowSeriesFromAggregates(
    cashFlowRows.map(row => ({
      period: bucket === 'month' ? monthKey(row.period) : row.period.toISOString().slice(0, 10),
      income: Number(row.income),
      spending: Number(row.spending)
    })),
    from,
    to,
    bucket
  )

  const topMerchants = merchantRows.map(row => ({
    name: row.name,
    amount: Math.round(Number(row.amount) * 100) / 100
  }))

  const netWorth = options.lite
    ? []
    : netWorthFromMonthlyTotals(
        totalBalance,
        monthlyNet.map(row => ({
          period: monthKey(row.period),
          net: Number(row.net)
        })),
        from,
        to
      )

  return {
    range,
    summary: {
      totalBalance,
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
    select: { id: true, balance: true, createdAt: true }
  })

  const currency = await resolveSpaceDisplayCurrency(ctx.spaceId, locale)

  return getAnalyticsOverview(
    {
      spaceId: ctx.spaceId,
      accountIds: accounts.map(account => account.id),
      accounts: accounts.map(account => ({
        balance: Number(account.balance),
        createdAt: account.createdAt
      })),
      currency
    },
    range,
    options
  )
}
