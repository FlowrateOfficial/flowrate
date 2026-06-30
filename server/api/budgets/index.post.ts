import { budgetBodySchema } from '../../lib/schemas/api'
import { localeFromRequest, resolveSpaceDisplayCurrency } from '../../utils/currency'
import { createBudgetForSpace } from '../../lib/services/budgets.service'
import { requireSpaceContext } from '../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const body = await readValidatedBody(event, budgetBodySchema.parse)
  const currency = await resolveSpaceDisplayCurrency(ctx.spaceId, localeFromRequest(event))
  return createBudgetForSpace(ctx, body, currency)
})
