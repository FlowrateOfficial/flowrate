export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)

  if (space.type !== 'COMPANY') {
    throw createError({ statusCode: 400, message: 'Burn rate is only available for Company spaces' })
  }

  if (!canViewFinancials(membership.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [accounts, monthlyTx, subscriptions] = await Promise.all([
    prisma.account.findMany({
      where: { spaceId: space.id, ...accountVisibilityFilter(user.id, membership.role) }
    }),
    prisma.transaction.findMany({
      where: { spaceId: space.id, date: { gte: startOfMonth } }
    }),
    prisma.detectedSubscription.findMany({
      where: { spaceId: space.id, status: 'ACTIVE' }
    })
  ])

  const cash = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
  const monthlyBurn = monthlyTx
    .filter(t => Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
  const monthlyIncome = monthlyTx
    .filter(t => Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const monthlySubs = subscriptions.reduce((sum, s) => sum + Number(s.amount), 0)
  const netBurn = monthlyBurn - monthlyIncome
  const runwayMonths = netBurn > 0 ? cash / netBurn : null

  const duplicateSubs = subscriptions.reduce<Record<string, number>>((acc, s) => {
    const key = s.name.toLowerCase()
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const wastedSubs = subscriptions
    .filter(s => duplicateSubs[s.name.toLowerCase()] > 1)
    .reduce((sum, s) => sum + Number(s.amount), 0)

  return {
    cash,
    monthlyBurn,
    monthlyIncome,
    netBurn,
    runwayMonths: runwayMonths ? Math.round(runwayMonths * 10) / 10 : null,
    monthlySubscriptions: monthlySubs,
    subscriptionWaste: wastedSubs,
    activeSubscriptions: subscriptions.length,
    cloudSpend: monthlyTx
      .filter(t => t.category === 'CLOUD_INFRA' || t.category === 'DEVELOPER_TOOLS')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
  }
})
