import { exchangePlaidPublicToken } from '../../lib/services/plaid-exchange.service'
import { plaidExchangeBodySchema } from '../../lib/schemas/api'

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)
  const body = await readValidatedBody(event, plaidExchangeBodySchema.parse)
  return exchangePlaidPublicToken(event, user, space, membership, space.type, body)
})
