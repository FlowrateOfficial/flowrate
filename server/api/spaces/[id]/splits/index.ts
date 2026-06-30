import { createSplitForSpace, listSplitsForSpace } from '../../../../lib/services/splits.service'
import { splitRuleBodySchema } from '../../../../lib/schemas/api'
import { requireSpaceContext } from '../../../../lib/domain/http'
import { assertRouteSpaceId } from '../../../../lib/domain/space-guard'
import { respondWithPrivateCache } from '../../../../lib/http/cache'

export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const ctx = await requireSpaceContext(event)
  assertRouteSpaceId(ctx, spaceId)

  if (event.method === 'GET') {
    const payload = await listSplitsForSpace(ctx)
    return respondWithPrivateCache(event, payload) ?? undefined
  }

  if (event.method === 'POST') {
    const body = await readValidatedBody(event, splitRuleBodySchema.parse)
    return createSplitForSpace(ctx, body)
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
