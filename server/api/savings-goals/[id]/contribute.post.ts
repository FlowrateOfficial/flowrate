import { contributeToSavingsGoal } from '../../../lib/services/savings-goals.service'
import { savingsGoalContributeSchema } from '../../../lib/schemas/api'
import { requireSpaceContext } from '../../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Goal id required' })
  const body = await readValidatedBody(event, savingsGoalContributeSchema.parse)
  return contributeToSavingsGoal(ctx, id, body.amount)
})
