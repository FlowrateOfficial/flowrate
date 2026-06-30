import { getValidStripeCustomerId } from '../../../lib/stripe/customer'
import { requireStripe } from '../../../lib/stripe'
import { createStripeCustomerInvoice } from '../../../lib/services/billing-invoices.service'
import {
  loadStripeUserContext,
  stripeInvoiceTemplateId
} from '../../../utils/stripeUser'

export default defineEventHandler(async (event) => {
  const { user } = await loadStripeUserContext(event)
  const { stripe } = requireStripe(event)
  const templateId = stripeInvoiceTemplateId(event)

  const customerId = await getValidStripeCustomerId(stripe, user.id)
  if (!customerId) {
    throw createError({
      statusCode: 400,
      message: 'No Stripe customer yet. Save your billing profile first.'
    })
  }

  const invoice = await createStripeCustomerInvoice(
    stripe,
    user.id,
    customerId,
    templateId ?? null
  )

  return { invoice }
})
