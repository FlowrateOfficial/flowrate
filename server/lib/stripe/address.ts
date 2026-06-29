import type Stripe from 'stripe'
import type { BillingAddress, BillingAddressInput } from '#shared/billing-address'
import { ensureStripeCustomer } from './customer'
import { getStripeCustomerId } from '../billing/repository'
import type { StripeUserRef } from './types'

export function stripeAddressFromInput(input: BillingAddressInput): Stripe.AddressParam {
  return {
    line1: input.line1,
    line2: input.line2 ?? undefined,
    city: input.city,
    state: input.state ?? undefined,
    postal_code: input.postalCode,
    country: input.country
  }
}

export function billingAddressFromStripe(
  address: Stripe.Address | null | undefined
): BillingAddress | null {
  if (!address?.line1 || !address.city || !address.postal_code || !address.country) {
    return null
  }

  return {
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city,
    state: address.state ?? null,
    postalCode: address.postal_code,
    country: address.country.toUpperCase()
  }
}

export async function getStripeCustomerBillingAddress(
  stripe: Stripe,
  userId: string
): Promise<BillingAddress | null> {
  const customerId = await getStripeCustomerId(userId)
  if (!customerId) return null

  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null

  return billingAddressFromStripe(customer.address)
}

export async function updateStripeCustomerBillingAddress(
  stripe: Stripe,
  user: StripeUserRef,
  input: BillingAddressInput,
  metadata: Record<string, string> = {}
): Promise<BillingAddress> {
  const customerId = await ensureStripeCustomer(stripe, user, {
    userId: user.id,
    ...metadata
  })

  const customer = await stripe.customers.update(customerId, {
    address: stripeAddressFromInput(input)
  })

  const saved = billingAddressFromStripe(customer.address)
  if (saved) return saved

  return {
    line1: input.line1,
    line2: input.line2 ?? null,
    city: input.city,
    state: input.state ?? null,
    postalCode: input.postalCode,
    country: input.country
  }
}
