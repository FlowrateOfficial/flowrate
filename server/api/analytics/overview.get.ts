import { getAnalyticsForSpace } from '../../lib/services/analytics.service'
import { analyticsRangeQuerySchema } from '../../lib/schemas/api'
import { localeFromRequest } from '../../utils/currency'
import { requireSpaceContext } from '../../lib/domain/http'
import { respondWithPrivateCache } from '../../lib/http/cache'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const { range } = await getValidatedQuery(event, analyticsRangeQuerySchema.parse)
  const queryLocale = getQuery(event).locale
  const locale = typeof queryLocale === 'string' && queryLocale.trim()
    ? queryLocale.trim()
    : localeFromRequest(event)
  const payload = await getAnalyticsForSpace(ctx, range, locale)
  return respondWithPrivateCache(event, payload) ?? undefined
})
