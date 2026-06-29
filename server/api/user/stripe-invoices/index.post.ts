import { getValidStripeCustomerId } from '../../../lib/stripe/customer'
import { requireStripe } from '../../../lib/stripe'
import {
  assertBillingAddressComplete,
  generateStripeCustomerInvoice,
  getStripeCustomerProfile
} from '../../../lib/stripe/customer-profile'
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

  const profile = await getStripeCustomerProfile(stripe, user.id, Boolean(templateId))
  assertBillingAddressComplete(profile.address)

  const billing = await prisma.userBilling.findUnique({
    where: { userId: user.id },
    select: {
      subscription: {
        select: { subId: true, status: true }
      }
    }
  })

  const status = billing?.subscription?.status
  const subscriptionId = status === 'ACTIVE' || status === 'TRIALING'
    ? billing?.subscription?.subId ?? null
    : null

  const invoice = await generateStripeCustomerInvoice(
    stripe,
    customerId,
    subscriptionId,
    templateId
  )

  return { invoice }
})
