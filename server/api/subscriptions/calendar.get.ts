import { getRenewalCalendarForSpace } from '../../lib/services/subscriptions.service'
import { requireSpaceContext } from '../../lib/domain/http'
import { localeFromRequest, resolveSpaceDisplayCurrency } from '../../utils/currency'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const currency = await resolveSpaceDisplayCurrency(ctx.spaceId, localeFromRequest(event))
  return getRenewalCalendarForSpace(ctx, currency)
})
