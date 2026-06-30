import { getBusinessOverview } from '../../../../lib/services/business.service'
import { requireSpaceContext } from '../../../../lib/domain/http'
import { respondWithPrivateCache } from '../../../../lib/http/cache'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const payload = await getBusinessOverview(ctx)
  return respondWithPrivateCache(event, payload) ?? undefined
})
