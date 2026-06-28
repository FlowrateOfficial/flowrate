import type { SpaceContext } from '../domain/context'
import { accountWhereForSpace } from '../repositories/account.repository'
import {
  pctChange,
  transactionPeriodStats,
  transactionsInRange
} from '../repositories/transaction.repository'

export async function getDashboardStats(ctx: SpaceContext) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const accountFilter = accountWhereForSpace(ctx, 'all')

  const [accounts, currentMonthTx, lastMonthTx, memberCount, subscriptionAlerts] = await Promise.all([
    prisma.account.findMany({ where: accountFilter }),
    transactionsInRange(ctx.spaceId, startOfMonth),
    transactionsInRange(ctx.spaceId, startOfLastMonth, endOfLastMonth),
    prisma.spaceMember.count({ where: { spaceId: ctx.spaceId, status: 'ACTIVE' } }),
    prisma.detectedSubscription.count({
      where: {
        spaceId: ctx.spaceId,
        status: { in: ['PRICE_CHANGED', 'ACTIVE'] },
        priceAlert: true
      }
    })
  ])

  const current = transactionPeriodStats(currentMonthTx)
  const last = transactionPeriodStats(lastMonthTx)

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
  const sharedBalance = accounts
    .filter(a => a.visibility === 'SHARED')
    .reduce((sum, a) => sum + Number(a.balance), 0)
  const personalBalance = accounts
    .filter(a => a.userId === ctx.userId && a.visibility === 'PERSONAL')
    .reduce((sum, a) => sum + Number(a.balance), 0)

  const burnRate = current.spending
  const runwayMonths = burnRate > 0 ? Math.round((totalBalance / burnRate) * 10) / 10 : null

  return {
    spaceType: ctx.spaceType,
    memberCount,
    totalBalance,
    sharedBalance,
    personalBalance,
    balanceChange: pctChange(totalBalance, totalBalance),
    monthlySpending: current.spending,
    spendingChange: pctChange(current.spending, last.spending),
    monthlyIncome: current.income,
    incomeChange: pctChange(current.income, last.income),
    netSavings: current.net,
    savingsChange: pctChange(current.net, last.net),
    burnRate,
    burnRateChange: pctChange(current.spending, last.spending),
    runwayMonths,
    subscriptionAlerts
  }
}
