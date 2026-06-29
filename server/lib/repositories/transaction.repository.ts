import type { Prisma } from '~~/generated/prisma/client'

export async function spendingIncomeInRange(
  spaceId: string,
  from: Date,
  to?: Date
) {
  const dateFilter: Prisma.DateTimeFilter = { gte: from }
  if (to) dateFilter.lte = to

  const baseWhere = { spaceId, date: dateFilter }

  const [spendingAgg, incomeAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...baseWhere, amount: { lt: 0 } },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { ...baseWhere, amount: { gt: 0 } },
      _sum: { amount: true }
    })
  ])

  const spending = Math.abs(Number(spendingAgg._sum.amount ?? 0))
  const income = Number(incomeAgg._sum.amount ?? 0)
  return { spending, income, net: income - spending }
}

export async function transactionsInRange(
  spaceId: string,
  from: Date,
  to?: Date
) {
  const dateFilter: Prisma.DateTimeFilter = { gte: from }
  if (to) dateFilter.lte = to

  return prisma.transaction.findMany({
    where: { spaceId, date: dateFilter }
  })
}

export function transactionPeriodStats(txs: Array<{ amount: unknown }>) {
  const spending = txs
    .filter(t => Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
  const income = txs
    .filter(t => Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0)
  return { spending, income, net: income - spending }
}

export function pctChange(current: number, previous: number): string | null {
  if (previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}
