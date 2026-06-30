import { getRenewalCalendarForSpace } from '../../lib/services/subscriptions.service'
import { requireSpaceContext } from '../../lib/domain/http'
import { localeFromRequest, resolveSpaceDisplayCurrency } from '../../utils/currency'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const queryLocale = getQuery(event).locale
  const locale = typeof queryLocale === 'string' && queryLocale.trim()
    ? queryLocale.trim()
    : localeFromRequest(event)
  const currency = await resolveSpaceDisplayCurrency(ctx.spaceId, locale)
  return getRenewalCalendarForSpace(ctx, currency)
})
