import type { SpaceContext } from '../domain/context'
import { listVisibleAccountBalances } from '../repositories/account.repository'
import { getDashboardStats } from './dashboard.service'
import { getAnalyticsOverview } from './analytics.service'
import { getAccountsForSpace } from './accounts.service'
import { listAlertSubscriptionsForSpace } from './subscriptions.service'
import { listRecentTransactionsForSpace } from './transactions.service'
import { planHasFeature } from '#shared/plan-limits'
import { userPlanForId } from '../billing/enforcement'
import { localeFromRequest, resolveSpaceDisplayCurrency } from '../../utils/currency'
import type { H3Event } from 'h3'

export async function getDashboardOverview(ctx: SpaceContext, event: H3Event) {
  const plan = await userPlanForId(ctx.userId)
  const includeSaas = planHasFeature(plan, 'saasShield')
  const queryLocale = getQuery(event).locale
  const locale = typeof queryLocale === 'string' && queryLocale.trim()
    ? queryLocale.trim()
    : localeFromRequest(event)
  const currency = await resolveSpaceDisplayCurrency(ctx.spaceId, locale)

  const visibleAccounts = await listVisibleAccountBalances(ctx)
  const accountIds = visibleAccounts.map(account => account.id)

  const [stats, analytics, accounts, transactions, alertSubscriptions] = await Promise.all([
    getDashboardStats(ctx, currency).then((s) => {
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
        accounts: visibleAccounts.map(account => ({
          balance: Number(account.balance),
          currency: account.currency,
          createdAt: account.createdAt
        })),
        currency
      },
      '30d',
      { lite: true }
    ),
    getAccountsForSpace(ctx, 'all'),
    listRecentTransactionsForSpace(ctx, 8),
    includeSaas ? listAlertSubscriptionsForSpace(ctx.spaceId, 5, false) : listAlertSubscriptionsForSpace(ctx.spaceId, 5, true)
  ])

  const alertPayload = alertSubscriptions

  return {
    stats,
    analytics,
    transactions,
    accounts,
    alertSubscriptions: alertPayload.items,
    saasAlertPreview: {
      count: alertPayload.count,
      locked: alertPayload.locked
    }
  }
}
