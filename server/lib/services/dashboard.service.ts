// ANCHOR: Dashboard stats — balances and monthly cash flow with FX conversion
import { ENUM } from '#shared/prisma-enums'
import type { SpaceContext } from '../domain/context'
import { createFxConverter } from '../fx/converter'
import { accountWhereForSpace } from '../repositories/account.repository'
import {
  pctChange,
  spendingIncomeInRange
} from '../repositories/transaction.repository'

function sumConverted(
  fx: Awaited<ReturnType<typeof createFxConverter>>,
  rows: Array<{ currency: string, amount: number }>
) {
  return fx.sum(rows.map(row => ({ amount: row.amount, currency: row.currency })))
}

export async function getDashboardStats(ctx: SpaceContext, displayCurrency: string) {
  const fx = await createFxConverter(displayCurrency)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const accountFilter = accountWhereForSpace(ctx, 'all')

  const [accounts, current, last, memberCount, subscriptionAlerts] = await Promise.all([
    prisma.account.findMany({
      where: accountFilter,
      select: { balance: true, visibility: true, userId: true, currency: true }
    }),
    spendingIncomeInRange(ctx.spaceId, startOfMonth),
    spendingIncomeInRange(ctx.spaceId, startOfLastMonth, endOfLastMonth),
    prisma.spaceMember.count({ where: { spaceId: ctx.spaceId, status: ENUM.member.ACTIVE } }),
    prisma.detectedSubscription.count({
      where: {
        spaceId: ctx.spaceId,
        alert: true
      }
    })
  ])

  const toMoney = (balance: number, currency: string) => ({ amount: balance, currency })

  const totalBalance = fx.sum(accounts.map(account => toMoney(Number(account.balance), account.currency)))
  const sharedBalance = fx.sum(
    accounts
      .filter(account => account.visibility === ENUM.visibility.SHARED)
      .map(account => toMoney(Number(account.balance), account.currency))
  )
  const personalBalance = fx.sum(
    accounts
      .filter(account => account.userId === ctx.userId && account.visibility === ENUM.visibility.PERSONAL)
      .map(account => toMoney(Number(account.balance), account.currency))
  )

  const monthlySpending = sumConverted(fx, current.spendingByCurrency)
  const monthlyIncome = sumConverted(fx, current.incomeByCurrency)
  const lastSpending = sumConverted(fx, last.spendingByCurrency)
  const lastIncome = sumConverted(fx, last.incomeByCurrency)
  const netSavings = monthlyIncome - monthlySpending
  const lastNet = lastIncome - lastSpending

  const burnRate = monthlySpending
  const runwayMonths = burnRate > 0 ? Math.round((totalBalance / burnRate) * 10) / 10 : null

  return {
    spaceType: ctx.spaceType,
    memberCount,
    currency: displayCurrency,
    totalBalance,
    sharedBalance,
    personalBalance,
    balanceChange: pctChange(totalBalance, totalBalance),
    monthlySpending,
    spendingChange: pctChange(monthlySpending, lastSpending),
    monthlyIncome,
    incomeChange: pctChange(monthlyIncome, lastIncome),
    netSavings,
    savingsChange: pctChange(netSavings, lastNet),
    burnRate,
    burnRateChange: pctChange(monthlySpending, lastSpending),
    runwayMonths,
    subscriptionAlerts
  }
}
