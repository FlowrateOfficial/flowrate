import { getMemberFinancial } from '../../../../../lib/services/members-financial.service'
import { requireSpaceContext } from '../../../../../lib/domain/http'
import { assertRouteSpaceId } from '../../../../../lib/domain/space-guard'
import { respondWithPrivateCache } from '../../../../../lib/http/cache'
import { localeFromRequest, resolveSpaceDisplayCurrency } from '../../../../../utils/currency'

export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const memberId = getRouterParam(event, 'memberId')!
  const ctx = await requireSpaceContext(event)
  assertRouteSpaceId(ctx, spaceId)

  const currency = await resolveSpaceDisplayCurrency(spaceId, localeFromRequest(event))
  const payload = await getMemberFinancial(ctx, spaceId, memberId, currency)
  return respondWithPrivateCache(event, payload) ?? undefined
})
