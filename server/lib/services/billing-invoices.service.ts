// ANCHOR: Stripe customer invoice generation service
import type Stripe from 'stripe'
import {
  assertBillingAddressComplete,
  generateStripeCustomerInvoice,
  getStripeCustomerProfile
} from '../stripe/customer-profile'
import { findActiveSubscriptionId } from '../repositories/space.repository'

export async function createStripeCustomerInvoice(
  stripe: Stripe,
  userId: string,
  customerId: string,
  templateId: string | null
) {
  const profile = await getStripeCustomerProfile(stripe, userId, Boolean(templateId))
  assertBillingAddressComplete(profile.address)

  const subscriptionId = await findActiveSubscriptionId(userId)

  return generateStripeCustomerInvoice(
    stripe,
    customerId,
    subscriptionId,
    templateId ?? undefined
  )
}
