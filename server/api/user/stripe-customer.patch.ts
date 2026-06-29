import { stripeCustomerProfileSchema } from '#shared/stripe-customer-profile'
import { requireStripe } from '../../lib/stripe'
import { updateStripeCustomerProfile, attachDbPhoneToProfile } from '../../lib/stripe/customer-profile'
import { loadStripeUserContext, stripeInvoiceTemplateId } from '../../utils/stripeUser'

export default defineEventHandler(async (event) => {
  const { user, metadata } = await loadStripeUserContext(event)
  const { stripe } = requireStripe(event)
  const body = await readValidatedBody(event, stripeCustomerProfileSchema.parse)

  const profile = await attachDbPhoneToProfile(
    user.id,
    await updateStripeCustomerProfile(
      stripe,
      user,
      body,
      metadata,
      stripeInvoiceTemplateId(event)
    )
  )

  return { profile }
})
