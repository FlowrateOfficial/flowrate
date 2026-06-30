import { createMemberInvite, listMembersForSpace } from '../../../../lib/services/members.service'
import { requireSpaceContext } from '../../../../lib/domain/http'
import { assertRouteSpaceId } from '../../../../lib/domain/space-guard'
import { respondWithPrivateCache } from '../../../../lib/http/cache'

export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const ctx = await requireSpaceContext(event)
  assertRouteSpaceId(ctx, spaceId)

  if (event.method === 'GET') {
    const payload = await listMembersForSpace(ctx.spaceId)
    return respondWithPrivateCache(event, payload) ?? undefined
  }

  if (event.method === 'POST') {
    const config = useRuntimeConfig(event)
    return createMemberInvite(ctx, event, config.public.appUrl as string)
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
