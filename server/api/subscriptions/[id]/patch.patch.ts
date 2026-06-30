import { patchSubscriptionForSpace } from '../../../lib/services/subscriptions.service'
import { subscriptionPatchBodySchema } from '../../../lib/schemas/api'
import { requireSpaceContext } from '../../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Subscription id required' })
  const body = await readValidatedBody(event, subscriptionPatchBodySchema.parse)
  return patchSubscriptionForSpace(ctx, id, body)
})
