import { getAccountsForSpace } from '../../lib/services/accounts.service'
import { parseAccountFilter, requireSpaceContext } from '../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const filter = parseAccountFilter(getQuery(event).visibility as string | undefined)
  return getAccountsForSpace(ctx, filter)
})
