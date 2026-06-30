import type { SpaceContext } from '../domain/context'
import { listAccounts } from '../repositories/account.repository'
import { getDashboardStats } from './dashboard.service'
import { getAnalyticsOverview } from './analytics.service'
import { mapAccountDto } from './accounts.service'
import { listAlertSubscriptionsForSpace } from './subscriptions.service'
import { listRecentTransactionsForSpace } from './transactions.service'
import { planHasFeature } from '#shared/plan-limits'
import { userPlanForId } from '../billing/enforcement'
import { localeFromRequest, resolveSpaceDisplayCurrency } from '../../utils/currency'
import type { H3Event } from 'h3'

export async function getDashboardOverview(ctx: SpaceContext, event: H3Event) {
  const queryLocale = getQuery(event).locale
  const locale = typeof queryLocale === 'string' && queryLocale.trim()
    ? queryLocale.trim()
    : localeFromRequest(event)

  const [plan, currency, accountRows] = await Promise.all([
    userPlanForId(ctx.userId),
    resolveSpaceDisplayCurrency(ctx.spaceId, locale),
    listAccounts(ctx, 'all')
  ])

  const includeSaas = planHasFeature(plan, 'saasShield')
  const accountIds = accountRows.map(account => account.id)
  const accounts = accountRows.map(row => mapAccountDto(row, ctx.userId))
  const analyticsAccounts = accountRows.map(account => ({
    balance: Number(account.balance),
    currency: account.currency,
    createdAt: account.createdAt
  }))

  const [stats, analytics, transactions, alertSubscriptions] = await Promise.all([
    getDashboardStats(ctx, currency, accountRows).then((s) => {
      if (!includeSaas) {
        return {
          ...s,
          burnRate: null,
          burnRateChange: null,
          runwayMonths: null,
          subscriptionAlerts: 0
        }
      }
      return s
    }),
    getAnalyticsOverview(
      {
        spaceId: ctx.spaceId,
        accountIds,
        accounts: analyticsAccounts,
        currency
      },
      '30d',
      { lite: true }
    ),
    listRecentTransactionsForSpace(ctx, 8, accountIds),
    includeSaas
      ? listAlertSubscriptionsForSpace(ctx.spaceId, 5, false)
      : listAlertSubscriptionsForSpace(ctx.spaceId, 5, true)
  ])

  return {
    stats,
    analytics,
    transactions,
    accounts,
    alertSubscriptions: alertSubscriptions.items,
    saasAlertPreview: {
      count: alertSubscriptions.count,
      locked: alertSubscriptions.locked
    }
  }
}
