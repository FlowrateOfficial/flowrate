import { stripePlanChangeBodySchema } from '../../lib/schemas/api'
import { previewSubscriptionChange } from '../../lib/billing/change-subscription'
import { requireStripe } from '../../lib/stripe'

export default defineEventHandler(async (event) => {
  const user = await requireNeonAuth(event)
  const { stripe } = requireStripe(event)
  const body = await readValidatedBody(event, stripePlanChangeBodySchema.parse)
  return previewSubscriptionChange(stripe, event, user.id, body)
})
