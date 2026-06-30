import type { Prisma, SpaceRole, TransactionCategory } from '~~/generated/prisma/client'
import type { SpaceContext } from '../domain/context'
import { accountVisibilityFilter } from '../../utils/spaceAuth'

export async function listVisibleAccountIds(
  spaceId: string,
  userId: string,
  role: SpaceRole
): Promise<string[]> {
  const rows = await prisma.account.findMany({
    where: { spaceId, ...accountVisibilityFilter(userId, role) },
    select: { id: true }
  })
  return rows.map(row => row.id)
}

export async function listVisibleAccountIdsForContext(ctx: SpaceContext): Promise<string[]> {
  return listVisibleAccountIds(ctx.spaceId, ctx.userId, ctx.role)
}

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

export interface TransactionListQuery {
  page: number
  limit: number
  category?: string
  search?: string
  accountId?: string
  visibility?: 'all' | 'shared' | 'personal' | 'mine'
  dateFrom?: string
  dateTo?: string
}

export function buildTransactionWhere(
  ctx: SpaceContext,
  visibleAccountIds: string[],
  query: TransactionListQuery
): Prisma.TransactionWhereInput {
  return {
    spaceId: ctx.spaceId,
    accountId: { in: visibleAccountIds },
    ...(query.category ? { category: query.category as TransactionCategory } : {}),
    ...(query.accountId ? { accountId: query.accountId } : {}),
    ...(query.visibility === 'mine' ? { userId: ctx.userId } : {}),
    ...(query.dateFrom || query.dateTo
      ? {
          date: {
            ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
            ...(query.dateTo ? { lte: new Date(query.dateTo) } : {})
          }
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { description: { contains: query.search, mode: 'insensitive' } },
            { merchant: { contains: query.search, mode: 'insensitive' } }
          ]
        }
      : {})
  }
}

export async function findTransactionsPage(
  where: Prisma.TransactionWhereInput,
  skip: number,
  take: number
) {
  return prisma.transaction.findMany({
    where,
    include: {
      account: { select: { id: true, name: true, visibility: true } },
      user: { select: { id: true, name: true } }
    },
    orderBy: { date: 'desc' },
    skip,
    take
  })
}

export async function countTransactions(where: Prisma.TransactionWhereInput) {
  return prisma.transaction.count({ where })
}

export async function findRecentTransactions(
  where: Prisma.TransactionWhereInput,
  limit: number
) {
  return prisma.transaction.findMany({
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
  })
}

export async function findTransactionInSpace(
  transactionId: string,
  spaceId: string,
  visibleAccountIds: string[]
) {
  return prisma.transaction.findFirst({
    where: { id: transactionId, spaceId, accountId: { in: visibleAccountIds } }
  })
}

export async function updateTransaction(
  transactionId: string,
  data: { category?: TransactionCategory, description?: string }
) {
  return prisma.transaction.update({
    where: { id: transactionId },
    data,
    include: { account: { select: { id: true, name: true } } }
  })
}

export async function findTransactionsForExport(
  spaceId: string,
  visibleAccountIds: string[],
  options: { audit: boolean, limit: number }
) {
  return prisma.transaction.findMany({
    where: { spaceId, accountId: { in: visibleAccountIds } },
    include: {
      account: { select: { name: true } },
      user: options.audit ? { select: { id: true, email: true, name: true } } : false
    },
    orderBy: { date: 'desc' },
    take: options.limit
  })
}

export async function spentByCategorySince(
  spaceId: string,
  accountIds: string[],
  from: Date
) {
  if (!accountIds.length) return new Map<string, number>()

  const groups = await prisma.transaction.groupBy({
    by: ['category'],
    where: {
      spaceId,
      accountId: { in: accountIds },
      date: { gte: from },
      amount: { lt: 0 }
    },
    _sum: { amount: true }
  })

  return new Map(
    groups.map(group => [group.category, Math.abs(Number(group._sum.amount ?? 0))])
  )
}
