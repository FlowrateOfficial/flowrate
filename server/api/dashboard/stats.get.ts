import { getDashboardStats } from '../../lib/services/dashboard.service'
import { requireSpaceContext } from '../../lib/domain/http'
import { respondWithPrivateCache } from '../../lib/http/cache'
import { userPlanForId } from '../../lib/billing/enforcement'
import { planHasFeature } from '#shared/plan-limits'
import { resolveSpaceDisplayCurrency, localeFromRequest } from '../../utils/currency'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const currency = await resolveSpaceDisplayCurrency(ctx.spaceId, localeFromRequest(event))
  const stats = await getDashboardStats(ctx, currency)
  const plan = await userPlanForId(ctx.userId)

  const payload = !planHasFeature(plan, 'saasShield')
    ? {
        ...stats,
        burnRate: null,
        burnRateChange: null,
        runwayMonths: null,
        subscriptionAlerts: 0
      }
    : stats

  return respondWithPrivateCache(event, payload) ?? undefined
})
