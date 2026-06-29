import { getDashboardStats } from '../../lib/services/dashboard.service'
import { requireSpaceContext } from '../../lib/domain/http'
import { userPlanForId } from '../../lib/billing/enforcement'
import { planHasFeature } from '#shared/plan-limits'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const stats = await getDashboardStats(ctx)
  const plan = await userPlanForId(ctx.userId)

  if (!planHasFeature(plan, 'saasShield')) {
    return {
      ...stats,
      burnRate: null,
      burnRateChange: null,
      runwayMonths: null,
      subscriptionAlerts: 0
    }
  }

  return stats
})
