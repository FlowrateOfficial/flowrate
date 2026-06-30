import { createStripeCheckoutSession } from '../../lib/services/billing-checkout.service'
import { stripeCheckoutBodySchema } from '../../lib/schemas/api'
import { requireStripe } from '../../lib/stripe'

export default defineEventHandler(async (event) => {
  const authUser = await requireNeonAuth(event)
  requireStripe(event)
  const body = await readValidatedBody(event, stripeCheckoutBodySchema.parse)
  return createStripeCheckoutSession(event, authUser.id, body)
})
