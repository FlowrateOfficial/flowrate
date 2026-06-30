import { localeFromRequest, resolveSpaceDisplayCurrency } from '../../utils/currency'
import { listBudgetsForSpace } from '../../lib/services/budgets.service'
import { requireSpaceContext } from '../../lib/domain/http'
import { respondWithPrivateCache } from '../../lib/http/cache'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const currency = await resolveSpaceDisplayCurrency(ctx.spaceId, localeFromRequest(event))
  const payload = await listBudgetsForSpace(ctx, currency)
  return respondWithPrivateCache(event, payload) ?? undefined
})
