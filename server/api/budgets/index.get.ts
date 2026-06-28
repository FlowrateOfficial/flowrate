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

  const results = await Promise.all(budgets.map(async (b) => {
    const from = periodStart(b.period, now)
    const agg = await prisma.transaction.aggregate({
      where: {
        spaceId: space.id,
        accountId: { in: visibleAccountIds },
        category: b.category,
        date: { gte: from },
        amount: { lt: 0 }
      },
      _sum: { amount: true }
    })

    return {
      id: b.id,
      name: b.name,
      category: b.category,
      amount: Number(b.amount),
      currency: 'USD',
      spent: Math.abs(Number(agg._sum.amount ?? 0)),
      period: b.period,
      isShared: b.isShared,
      isMine: b.userId === user.id
    }
  }))

  return results
})
