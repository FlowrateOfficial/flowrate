import {
  addChildSavingsJar,
  patchChildProfileForSpace
} from '../../../../../lib/services/members.service'
import {
  childProfilePatchBodySchema,
  savingsJarBodySchema
} from '../../../../../lib/schemas/api'
import { requireSpaceContext } from '../../../../../lib/domain/http'
import { assertRouteSpaceId } from '../../../../../lib/domain/space-guard'

export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const memberId = getRouterParam(event, 'memberId')!
  const ctx = await requireSpaceContext(event)
  assertRouteSpaceId(ctx, spaceId)

  if (event.method === 'PATCH') {
    const body = await readValidatedBody(event, childProfilePatchBodySchema.parse)
    return patchChildProfileForSpace(ctx, memberId, body)
  }

  if (event.method === 'POST') {
    const body = await readValidatedBody(event, savingsJarBodySchema.parse)
    return addChildSavingsJar(ctx, memberId, body)
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
