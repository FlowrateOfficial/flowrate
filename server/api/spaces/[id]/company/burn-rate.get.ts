export type BusinessAlertSeverity = 'info' | 'warning' | 'critical'

export interface BusinessAlert {
  severity: BusinessAlertSeverity
  code: string
  params?: Record<string, string | number>
}

export interface BusinessOverview {
  cash: number
  monthlyBurn: number
  monthlyIncome: number
  netBurn: number
  runwayMonths: number | null
  monthlySubscriptions: number
  subscriptionWaste: number
  activeSubscriptions: number
  cloudSpend: number
  setup: {
    hasAccounts: boolean
    hasTransactions: boolean
    complete: boolean
    step: 1 | 2 | 3 | 4
  }
  alerts: BusinessAlert[]
  topVendors: Array<{ name: string, amount: number }>
}

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)

  if (space.type !== 'COMPANY') {
    throw createError({ statusCode: 400, message: 'Business metrics are only available for Business spaces' })
  }

  if (!canViewFinancials(membership.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [accounts, monthlyTx, subscriptions, txCount] = await Promise.all([
    prisma.account.findMany({
      where: { spaceId: space.id, ...accountVisibilityFilter(user.id, membership.role) }
    }),
    prisma.transaction.findMany({
      where: { spaceId: space.id, date: { gte: startOfMonth } }
    }),
    prisma.detectedSubscription.findMany({
      where: { spaceId: space.id, status: 'ACTIVE' }
    }),
    prisma.transaction.count({ where: { spaceId: space.id } })
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

  const cloudSpend = monthlyTx
    .filter(t => t.category === 'CLOUD_INFRA' || t.category === 'DEVELOPER_TOOLS')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

  const vendorTotals = monthlyTx
    .filter(t => Number(t.amount) < 0)
    .reduce<Record<string, number>>((acc, t) => {
      const name = (t.merchant ?? t.description).trim()
      if (!name) return acc
      acc[name] = (acc[name] ?? 0) + Math.abs(Number(t.amount))
      return acc
    }, {})

  const topVendors = Object.entries(vendorTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }))

  const hasAccounts = accounts.length > 0
  const hasTransactions = txCount > 0
  const setupStep = !hasAccounts ? 1 : !hasTransactions ? 2 : 3
  const setupComplete = hasAccounts && hasTransactions

  const alerts: BusinessAlert[] = []

  if (!hasAccounts) {
    alerts.push({ severity: 'info', code: 'CONNECT_BANK' })
  } else if (!hasTransactions) {
    alerts.push({ severity: 'info', code: 'SYNC_TRANSACTIONS' })
  }

  if (runwayMonths != null && runwayMonths < 6 && netBurn > 0) {
    alerts.push({
      severity: runwayMonths < 3 ? 'critical' : 'warning',
      code: 'LOW_RUNWAY',
      params: { months: Math.round(runwayMonths * 10) / 10 }
    })
  }

  if (wastedSubs > 0) {
    alerts.push({
      severity: 'warning',
      code: 'SAAS_WASTE',
      params: { amount: Math.round(wastedSubs) }
    })
  }

  if (cloudSpend > 0 && monthlyBurn > 0 && cloudSpend / monthlyBurn > 0.25) {
    alerts.push({
      severity: 'warning',
      code: 'HIGH_CLOUD_SPEND',
      params: { percent: Math.round((cloudSpend / monthlyBurn) * 100) }
    })
  }

  if (subscriptions.length >= 8) {
    alerts.push({
      severity: 'info',
      code: 'MANY_SUBSCRIPTIONS',
      params: { count: subscriptions.length }
    })
  }

  const overview: BusinessOverview = {
    cash,
    monthlyBurn,
    monthlyIncome,
    netBurn,
    runwayMonths: runwayMonths ? Math.round(runwayMonths * 10) / 10 : null,
    monthlySubscriptions: monthlySubs,
    subscriptionWaste: wastedSubs,
    activeSubscriptions: subscriptions.length,
    cloudSpend,
    setup: {
      hasAccounts,
      hasTransactions,
      complete: setupComplete,
      step: setupComplete ? 4 : setupStep as 1 | 2 | 3
    },
    alerts,
    topVendors
  }

  return overview
})
