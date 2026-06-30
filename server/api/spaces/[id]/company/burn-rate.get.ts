import { getBusinessOverview } from '../../../../lib/services/business.service'
import { requireSpaceContext } from '../../../../lib/domain/http'
import { respondWithPrivateCache } from '../../../../lib/http/cache'
import { localeFromRequest, resolveSpaceDisplayCurrency } from '../../../../utils/currency'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const currency = await resolveSpaceDisplayCurrency(ctx.spaceId, localeFromRequest(event))
  const payload = await getBusinessOverview(ctx, currency)
  return respondWithPrivateCache(event, payload) ?? undefined
})
