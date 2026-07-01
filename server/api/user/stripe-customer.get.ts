import { requireSessionUser } from '../../lib/auth'
import { requireStripe, findAndLinkStripeCustomer } from '../../lib/stripe'
import {
  getStripeCustomerProfile,
  reconcileStripeCustomerPhone
} from '../../lib/stripe/customer-profile'
import { stripeInvoiceTemplateId, loadStripeUserContext } from '../../utils/stripeUser'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const { stripe } = requireStripe(event)
  const config = useRuntimeConfig(event)
  const templateConfigured = Boolean(stripeInvoiceTemplateId(event))

  const { metadata } = await loadStripeUserContext(event)
  await findAndLinkStripeCustomer(stripe, user, metadata)

  let profile = await getStripeCustomerProfile(
    stripe,
    user.id,
    templateConfigured
  )

  profile = await reconcileStripeCustomerPhone(stripe, user.id, profile)

  return {
    configured: Boolean(config.public.mapboxAccessToken),
    profile
  }
})
