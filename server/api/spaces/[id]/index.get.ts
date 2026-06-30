import { getSpaceDetail } from '../../../lib/services/spaces.service'
import { requireSpaceContext } from '../../../lib/domain/http'
import { assertRouteSpaceId } from '../../../lib/domain/space-guard'
import { respondWithPrivateCache } from '../../../lib/http/cache'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const spaceId = getRouterParam(event, 'id')!
  assertRouteSpaceId(ctx, spaceId)

  const view = getQuery(event).view
  const payload = await getSpaceDetail(ctx, view != null ? String(view) : undefined)
  return respondWithPrivateCache(event, payload) ?? undefined
})
