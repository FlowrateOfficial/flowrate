import { periodStart } from '../../utils/budgetPeriod'

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)
  const now = new Date()

  const accountFilter = accountVisibilityFilter(user.id, membership.role)
  const visibleAccounts = await prisma.account.findMany({
    where: { spaceId: space.id, ...accountFilter },
    select: { id: true }
  })
  const visibleAccountIds = visibleAccounts.map(a => a.id)

  const budgets = await prisma.budget.findMany({
    where: {
      spaceId: space.id,
      OR: [{ isShared: true }, { userId: user.id }]
    },
    orderBy: { createdAt: 'asc' }
  })

  if (!budgets.length || !visibleAccountIds.length) {
    return budgets.map(b => ({
      id: b.id,
      name: b.name,
      category: b.category,
      amount: Number(b.amount),
      currency: 'USD',
      spent: 0,
      period: b.period,
      isShared: b.isShared,
      isMine: b.userId === user.id
    }))
  }

  const earliestFrom = budgets.reduce((min, b) => {
    const from = periodStart(b.period, now)
    return from < min ? from : min
  }, periodStart(budgets[0]!.period, now))

  const spendingTxs = await prisma.transaction.findMany({
    where: {
      spaceId: space.id,
      accountId: { in: visibleAccountIds },
      date: { gte: earliestFrom },
      amount: { lt: 0 }
    },
    select: { amount: true, category: true, date: true }
  })

  return budgets.map((b) => {
    const from = periodStart(b.period, now)
    const spent = spendingTxs
      .filter(tx => tx.category === b.category && tx.date >= from)
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)

    return {
      id: b.id,
      name: b.name,
      category: b.category,
      amount: Number(b.amount),
      currency: 'USD',
      spent,
      period: b.period,
      isShared: b.isShared,
      isMine: b.userId === user.id
    }
  })
})
