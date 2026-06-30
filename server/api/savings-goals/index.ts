import { listSavingsGoalsForSpace, createSavingsGoalForSpace } from '../../lib/services/savings-goals.service'
import { savingsGoalBodySchema } from '../../lib/schemas/api'
import { requireSpaceContext } from '../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  if (event.method === 'GET') return listSavingsGoalsForSpace(ctx)
  const body = await readValidatedBody(event, savingsGoalBodySchema.parse)
  return createSavingsGoalForSpace(ctx, body)
})
