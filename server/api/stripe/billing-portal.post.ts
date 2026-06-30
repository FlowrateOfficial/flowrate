import { createStripeBillingPortalSession } from '../../lib/services/billing-checkout.service'
import { requireStripe } from '../../lib/stripe'

export default defineEventHandler(async (event) => {
  const user = await requireNeonAuth(event)
  requireStripe(event)
  return createStripeBillingPortalSession(event, user.id)
})
