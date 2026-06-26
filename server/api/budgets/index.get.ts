export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

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

  const spending = await prisma.transaction.groupBy({
    by: ['category'],
    where: {
      spaceId: space.id,
      accountId: { in: visibleAccountIds },
      date: { gte: startOfMonth },
      amount: { lt: 0 }
    },
    _sum: { amount: true }
  })

  const spendingMap = Object.fromEntries(
    spending.map(s => [s.category, Math.abs(Number(s._sum.amount ?? 0))])
  )

  return budgets.map(b => ({
    id: b.id,
    name: b.name,
    category: b.category,
    amount: Number(b.amount),
    currency: 'USD',
    spent: spendingMap[b.category] ?? 0,
    period: b.period,
    isShared: b.isShared,
    isMine: b.userId === user.id
  }))
})
