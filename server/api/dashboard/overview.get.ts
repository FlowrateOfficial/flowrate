import { getDashboardOverview } from '../../lib/services/dashboard-overview.service'
import { requireSpaceContext } from '../../lib/domain/http'
import { respondWithPrivateCache } from '../../lib/http/cache'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const payload = await getDashboardOverview(ctx, event)
  return respondWithPrivateCache(event, payload) ?? undefined
})
