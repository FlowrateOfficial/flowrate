import { periodStart } from '../../utils/budgetPeriod'
import { localeFromRequest, resolveSpaceDisplayCurrency } from '../../utils/currency'
import type { BudgetPeriod } from '~~/generated/prisma/client'

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)
  const now = new Date()
  const currency = await resolveSpaceDisplayCurrency(space.id, localeFromRequest(event))

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
      currency,
      spent: 0,
      period: b.period,
      isShared: b.isShared,
      isMine: b.userId === user.id
    }))
  }

  const periodStarts = new Map<string, Date>()
  for (const budget of budgets) {
    const from = periodStart(budget.period, now)
    periodStarts.set(from.toISOString(), from)
  }

  const spentByPeriod = new Map<string, Map<string, number>>()

  await Promise.all([...periodStarts.entries()].map(async ([key, from]) => {
    const groups = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        spaceId: space.id,
        accountId: { in: visibleAccountIds },
        date: { gte: from },
        amount: { lt: 0 }
      },
      _sum: { amount: true }
    })

    spentByPeriod.set(
      key,
      new Map(groups.map(g => [g.category, Math.abs(Number(g._sum.amount ?? 0))]))
    )
  }))

  return budgets.map((b) => {
    const fromKey = periodStart(b.period as BudgetPeriod, now).toISOString()
    const spent = spentByPeriod.get(fromKey)?.get(b.category) ?? 0

    return {
      id: b.id,
      name: b.name,
      category: b.category,
      amount: Number(b.amount),
      currency,
      spent,
      period: b.period,
      isShared: b.isShared,
      isMine: b.userId === user.id
    }
  })
})
