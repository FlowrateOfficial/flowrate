import { requireStripe } from '../../lib/stripe'
import { syncSpaceTransactions } from '../../lib/transactionSync'

import { processAllowancePayouts } from '../../lib/allowance'

export default defineEventHandler(async (event) => {
  const { user, space } = await requireSpaceAccess(event)
  const { stripe } = requireStripe(event)

  const result = await syncSpaceTransactions(stripe, space.id, user.id)
  await processAllowancePayouts(space.id)
  return result
})
