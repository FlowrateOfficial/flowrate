import { transactionPatchBodySchema } from '../../lib/schemas/api'
import { patchTransactionForSpace } from '../../lib/services/transactions.service'
import { requireSpaceContext } from '../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, transactionPatchBodySchema.parse)
  return patchTransactionForSpace(ctx, id, body)
})
