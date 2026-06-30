import { disconnectAccount } from '../../lib/services/accounts.service'
import { requireSpaceContext } from '../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const id = getRouterParam(event, 'id')!
  return disconnectAccount(ctx, id, event)
})
