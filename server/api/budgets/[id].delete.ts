import { deleteBudgetForSpace } from '../../lib/services/budgets.service'
import { requireSpaceContext } from '../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const id = getRouterParam(event, 'id')!
  return deleteBudgetForSpace(ctx, id)
})
