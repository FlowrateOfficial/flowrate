import { checkSubscriptionCapForSpace } from '../../lib/services/subscriptions.service'
import { requireSpaceContext } from '../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const breach = await checkSubscriptionCapForSpace(ctx.spaceId, ctx.userId)
  if (!breach) return null
  return { ...breach, exceeded: true }
})
