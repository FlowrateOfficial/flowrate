// ANCHOR: Business burn-rate overview service
import type { BusinessOverviewDto } from '#shared/api/business'
import type { AppPlan } from '#shared/billing'
import { planHasFeature } from '#shared/plan-limits'
import type { SpaceContext } from '../domain/context'
import { assertSaasShield, userPlanForId } from '../billing/enforcement'
import { spendingIncomeInRange } from '../repositories/transaction.repository'
import { accountVisibilityFilter, canViewFinancials } from '../../utils/spaceAuth'

export async function getBusinessOverview(ctx: SpaceContext): Promise<BusinessOverviewDto> {
  if (ctx.spaceType !== 'COMPANY') {
    throw createError({ statusCode: 400, message: 'Business metrics are only available for Business spaces' })
  }

  if (!canViewFinancials(ctx.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' })
  }

  const ownerPlan = await userPlanForId(ctx.space.ownerId)
  await assertSaasShield(ctx.space.ownerId, ownerPlan)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const accountFilter = { spaceId: ctx.spaceId, ...accountVisibilityFilter(ctx.userId, ctx.role) }

  const [accounts, monthly, subscriptions, txCount, cloudAgg, vendorTxs] = await Promise.all([
    prisma.account.findMany({
      where: accountFilter,
      select: { balance: true }
    }),
    spendingIncomeInRange(ctx.spaceId, startOfMonth),
    prisma.detectedSubscription.findMany({
      where: { spaceId: ctx.spaceId, status: 'ACTIVE' },
      select: { name: true, amount: true }
    }),
    prisma.transaction.count({ where: { spaceId: ctx.spaceId } }),
    prisma.transaction.aggregate({
      where: {
        spaceId: ctx.spaceId,
        date: { gte: startOfMonth },
        amount: { lt: 0 },
        category: { in: ['CLOUD_INFRA', 'DEVELOPER_TOOLS'] }
      },
      _sum: { amount: true }
    }),
    prisma.transaction.findMany({
      where: {
        spaceId: ctx.spaceId,
        date: { gte: startOfMonth },
        amount: { lt: 0 }
      },
      select: { merchant: true, description: true, amount: true }
    })
  ])

  const cash = accounts.reduce((sum, account) => sum + Number(account.balance), 0)
  const monthlyBurn = monthly.spending
  const monthlyIncome = monthly.income
  const monthlySubs = subscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0)
  const netBurn = monthlyBurn - monthlyIncome
  const runwayMonths = netBurn > 0 ? cash / netBurn : null

  const duplicateSubs = subscriptions.reduce<Record<string, number>>((acc, sub) => {
    const key = sub.name.toLowerCase()
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const wastedSubs = subscriptions
    .filter(sub => (duplicateSubs[sub.name.toLowerCase()] ?? 0) > 1)
    .reduce((sum, sub) => sum + Number(sub.amount), 0)

  const cloudSpend = Math.abs(Number(cloudAgg._sum.amount ?? 0))

  const vendorTotals = vendorTxs.reduce<Record<string, number>>((acc, tx) => {
    const name = (tx.merchant ?? tx.description).trim()
    if (!name) return acc
    acc[name] = (acc[name] ?? 0) + Math.abs(Number(tx.amount))
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

  const alerts: BusinessOverviewDto['alerts'] = []

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

  if (
    cloudSpend > 0
    && monthlyBurn > 0
    && cloudSpend / monthlyBurn > 0.25
    && planHasFeature(ownerPlan as AppPlan, 'cloudSpendTracking')
  ) {
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

  return {
    cash,
    monthlyBurn,
    monthlyIncome,
    netBurn,
    runwayMonths: runwayMonths ? Math.round(runwayMonths * 10) / 10 : null,
    monthlySubscriptions: monthlySubs,
    subscriptionWaste: wastedSubs,
    activeSubscriptions: subscriptions.length,
    cloudSpend: planHasFeature(ownerPlan as AppPlan, 'cloudSpendTracking') ? cloudSpend : null,
    setup: {
      hasAccounts,
      hasTransactions,
      complete: setupComplete,
      step: setupComplete ? 4 : setupStep
    },
    alerts,
    topVendors
  }
}
