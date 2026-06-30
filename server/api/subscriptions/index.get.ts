import { listSubscriptionsForSpace } from '../../lib/services/subscriptions.service'
import { subscriptionListQuerySchema } from '../../lib/schemas/api'
import { requireSpaceContext } from '../../lib/domain/http'
import { respondWithPrivateCache } from '../../lib/http/cache'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const query = await getValidatedQuery(event, subscriptionListQuerySchema.parse)
  const payload = await listSubscriptionsForSpace(ctx, query)
  return respondWithPrivateCache(event, payload) ?? undefined
})
