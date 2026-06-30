// ANCHOR: Expense split rules service
import type { z } from 'zod'
import type { splitRuleBodySchema } from '../schemas/api'
import type { SpaceContext } from '../domain/context'
import { canManageMembers } from '../../utils/spaceAuth'
import { createSplitRule, listSplitRules } from '../repositories/space.repository'

type SplitBody = z.infer<typeof splitRuleBodySchema>

function assertCanManageSplits(ctx: SpaceContext) {
  if (ctx.spaceType === 'INDEPENDENT') {
    throw createError({ statusCode: 400, message: 'Split rules require a shared space' })
  }

  if (!canManageMembers(ctx.role, ctx.spaceType)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' })
  }
}

export async function listSplitsForSpace(ctx: SpaceContext) {
  assertCanManageSplits(ctx)
  return listSplitRules(ctx.spaceId)
}

export async function createSplitForSpace(ctx: SpaceContext, body: SplitBody) {
  assertCanManageSplits(ctx)
  return createSplitRule(ctx.spaceId, body)
}
