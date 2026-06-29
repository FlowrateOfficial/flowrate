import { z } from 'zod'
import { changeUserSubscription } from '../../lib/billing/change-subscription'
import { requireStripe } from '../../lib/stripe'

const bodySchema = z.object({
  planKey: z.string().min(1),
  interval: z.enum(['month', 'year'])
})

export default defineEventHandler(async (event) => {
  const user = await requireNeonAuth(event)
  const { stripe } = requireStripe(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  const result = await changeUserSubscription(stripe, event, user.id, body)
  return result
})
