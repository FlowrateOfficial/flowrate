import {
  listTransactionsForSpace,
  transactionListQuerySchema
} from '../../lib/services/transactions.service'
import { requireSpaceContext } from '../../lib/domain/http'
import { respondWithPrivateCache } from '../../lib/http/cache'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const query = await getValidatedQuery(event, transactionListQuerySchema.parse)
  const payload = await listTransactionsForSpace(ctx, query)
  return respondWithPrivateCache(event, payload) ?? undefined
})
