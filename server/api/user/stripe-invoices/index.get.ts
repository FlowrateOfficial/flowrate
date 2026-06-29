import { getValidStripeCustomerId } from '../../../lib/stripe/customer'
import { requireStripe } from '../../../lib/stripe'
import { listStripeCustomerInvoices } from '../../../lib/stripe/customer-profile'
import { loadStripeUserContext } from '../../../utils/stripeUser'

export default defineEventHandler(async (event) => {
  const { user } = await loadStripeUserContext(event)
  const { stripe } = requireStripe(event)

  const customerId = await getValidStripeCustomerId(stripe, user.id)
  if (!customerId) {
    return { invoices: [] }
  }

  const invoices = await listStripeCustomerInvoices(stripe, customerId)
  return { invoices }
})
