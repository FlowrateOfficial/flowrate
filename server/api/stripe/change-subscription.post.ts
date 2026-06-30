import { stripePlanChangeBodySchema } from '../../lib/schemas/api'
import { changeUserSubscription } from '../../lib/billing/change-subscription'
import { requireStripe } from '../../lib/stripe'

export default defineEventHandler(async (event) => {
  const user = await requireNeonAuth(event)
  const { stripe } = requireStripe(event)
  const body = await readValidatedBody(event, stripePlanChangeBodySchema.parse)
  return changeUserSubscription(stripe, event, user.id, body)
})
