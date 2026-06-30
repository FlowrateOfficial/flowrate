import { createChildAccount } from '../../../../lib/services/members.service'
import { createChildBodySchema } from '../../../../lib/schemas/api'
import { assertTeenAccounts } from '../../../../lib/billing/enforcement'
import { requireSpaceContext } from '../../../../lib/domain/http'
import { assertRouteSpaceId } from '../../../../lib/domain/space-guard'
import { canManageMembers } from '../../../../utils/spaceAuth'

export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const ctx = await requireSpaceContext(event)
  assertRouteSpaceId(ctx, spaceId)

  if (!canManageMembers(ctx.role, ctx.spaceType)) {
    throw createError({ statusCode: 403, message: 'Only guardians can create child accounts' })
  }

  await assertTeenAccounts(ctx.userId)

  const body = await readValidatedBody(event, createChildBodySchema.parse)

  const result = await createChildAccount(
    ctx.userId,
    ctx.spaceId,
    ctx.spaceType,
    body,
    event
  )

  return {
    member: result.member,
    created: true
  }
})
