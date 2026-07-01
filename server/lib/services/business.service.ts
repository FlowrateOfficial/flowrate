// ANCHOR: Business burn-rate overview service
import type { BusinessOverviewDto } from '#shared/api/business'
import type { AppPlan } from '#shared/billing'
import { planHasFeature } from '#shared/plan-limits'
import { ENUM } from '#shared/prisma-enums'
import type { SpaceContext } from '../domain/context'
import { assertSaasShield, userPlanForId } from '../billing/enforcement'
import { createFxConverter } from '../fx/converter'
import { spendingIncomeInRange } from '../repositories/transaction.repository'
import { accountVisibilityFilter, canViewFinancials } from '../../utils/spaceAuth'

function sumRows(
  fx: Awaited<ReturnType<typeof createFxConverter>>,
  rows: Array<{ currency: string, amount: number }>
) {
  return fx.sum(rows.map(row => ({ amount: row.amount, currency: row.currency })))
}

export async function getBusinessOverview(
  ctx: SpaceContext,
  displayCurrency: string
): Promise<BusinessOverviewDto> {
  if (ctx.spaceType !== ENUM.space.COMPANY) {
    throw createError({ statusCode: 400, message: 'Business metrics are only available for Business spaces' })
  }

  if (!canViewFinancials(ctx.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' })
  }

  const ownerPlan = await userPlanForId(ctx.space.ownerId)
  await assertSaasShield(ctx.space.ownerId, ownerPlan)
  const fx = await createFxConverter(displayCurrency)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const accountFilter = { spaceId: ctx.spaceId, ...accountVisibilityFilter(ctx.userId, ctx.role) }

  const [accounts, monthly, subscriptions, txCount, cloudRows, vendorRows] = await Promise.all([
    prisma.account.findMany({
      where: accountFilter,
      select: { balance: true, currency: true }
    }),
    spendingIncomeInRange(ctx.spaceId, startOfMonth),
    prisma.detectedSubscription.findMany({
      where: { spaceId: ctx.spaceId, status: ENUM.subscription.ACTIVE },
      select: { name: true, amount: true, currency: true }
    }),
    prisma.transaction.count({ where: { spaceId: ctx.spaceId } }),
    prisma.transaction.groupBy({
      by: ['currency'],
      where: {
        spaceId: ctx.spaceId,
        date: { gte: startOfMonth },
        amount: { lt: 0 },
        category: { in: [ENUM.category.CLOUD_INFRA, ENUM.category.DEVELOPER_TOOLS] }
      },
      _sum: { amount: true }
    }),
    prisma.transaction.groupBy({
      by: ['merchant', 'description', 'currency'],
      where: {
        spaceId: ctx.spaceId,
        date: { gte: startOfMonth },
        amount: { lt: 0 }
      },
      _sum: { amount: true }
    })
  ])

  const cash = fx.sum(accounts.map(account => ({
    amount: Number(account.balance),
    currency: account.currency
  })))
  const monthlyBurn = sumRows(fx, monthly.spendingByCurrency)
  const monthlyIncome = sumRows(fx, monthly.incomeByCurrency)
  const monthlySubs = fx.sum(subscriptions.map(sub => ({
    amount: Number(sub.amount),
    currency: sub.currency
  })))
  const netBurn = monthlyBurn - monthlyIncome
  const runwayMonths = netBurn > 0 ? cash / netBurn : null

  const duplicateSubs = subscriptions.reduce<Record<string, number>>((acc, sub) => {
    const key = sub.name.toLowerCase()
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const wastedSubs = subscriptions
    .filter(sub => (duplicateSubs[sub.name.toLowerCase()] ?? 0) > 1)
    .reduce((sum, sub) => sum + fx.convert(Number(sub.amount), sub.currency), 0)

  const cloudSpend = sumRows(
    fx,
    cloudRows.map(row => ({
      currency: row.currency,
      amount: Math.abs(Number(row._sum.amount ?? 0))
    }))
  )

  const vendorTotals = new Map<string, number>()
  for (const row of vendorRows) {
    const name = (row.merchant ?? row.description).trim()
    if (!name) continue
    const converted = fx.convert(Math.abs(Number(row._sum.amount ?? 0)), row.currency)
    vendorTotals.set(name, (vendorTotals.get(name) ?? 0) + converted)
  }

  const topVendors = [...vendorTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))

  const vendorTrends = await buildVendorTrends(ctx.spaceId, topVendors.slice(0, 3).map(v => v.name), fx, displayCurrency)

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
    currency: displayCurrency,
    cash: Math.round(cash * 100) / 100,
    monthlyBurn: Math.round(monthlyBurn * 100) / 100,
    monthlyIncome: Math.round(monthlyIncome * 100) / 100,
    netBurn: Math.round(netBurn * 100) / 100,
    runwayMonths: runwayMonths ? Math.round(runwayMonths * 10) / 10 : null,
    monthlySubscriptions: Math.round(monthlySubs * 100) / 100,
    subscriptionWaste: Math.round(wastedSubs * 100) / 100,
    activeSubscriptions: subscriptions.length,
    cloudSpend: planHasFeature(ownerPlan as AppPlan, 'cloudSpendTracking')
      ? Math.round(cloudSpend * 100) / 100
      : null,
    setup: {
      hasAccounts,
      hasTransactions,
      complete: setupComplete,
      step: setupComplete ? 4 : setupStep
    },
    alerts,
    topVendors,
    vendorTrends
  }
}

async function buildVendorTrends(
  spaceId: string,
  vendorNames: string[],
  fx: Awaited<ReturnType<typeof createFxConverter>>,
  _displayCurrency: string
) {
  if (!vendorNames.length) return []

  const since = new Date()
  since.setMonth(since.getMonth() - 5)
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const rows = await prisma.transaction.findMany({
    where: { spaceId, date: { gte: since }, amount: { lt: 0 } },
    select: { merchant: true, description: true, amount: true, currency: true, date: true }
  })

  const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

  return vendorNames.map((name) => {
    const key = name.toLowerCase()
    const pointsMap = new Map<string, number>()
    for (const row of rows) {
      const label = (row.merchant ?? row.description).trim()
      if (!label.toLowerCase().includes(key) && !key.includes(label.toLowerCase())) continue
      const mk = monthKey(row.date)
      const converted = fx.convert(Math.abs(Number(row.amount)), row.currency)
      pointsMap.set(mk, (pointsMap.get(mk) ?? 0) + converted)
    }
    const points = [...pointsMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }))
    return { name, points }
  })
}
