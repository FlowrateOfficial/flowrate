import { dismissSubscriptionAlert } from '../../../lib/services/subscriptions.service'
import { requireSpaceContext } from '../../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Subscription id required' })
  }
  return dismissSubscriptionAlert(ctx, id)
})
