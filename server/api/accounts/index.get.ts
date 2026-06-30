import { getAccountsForSpace } from '../../lib/services/accounts.service'
import { parseAccountFilter, requireSpaceContext } from '../../lib/domain/http'
import { respondWithPrivateCache } from '../../lib/http/cache'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const filter = parseAccountFilter(getQuery(event).visibility as string | undefined)
  const payload = await getAccountsForSpace(ctx, filter)
  return respondWithPrivateCache(event, payload) ?? undefined
})
