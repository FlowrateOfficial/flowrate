import { memberDeleteBodySchema } from '../../../../lib/schemas/api'
import { removeMemberFromSpace } from '../../../../lib/services/members.service'
import { requireSpaceContext } from '../../../../lib/domain/http'
import { assertRouteSpaceId } from '../../../../lib/domain/space-guard'

export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const memberId = getRouterParam(event, 'memberId')!
  const ctx = await requireSpaceContext(event)
  assertRouteSpaceId(ctx, spaceId)
  const body = await readValidatedBody(event, memberDeleteBodySchema.parse)
  return removeMemberFromSpace(event, ctx, memberId, body)
})
