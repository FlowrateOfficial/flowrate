// ANCHOR: Stripe customer ↔ app user linking
import type Stripe from 'stripe'
import {
  findUserIdByStripeCustomerId,
  getStripeCustomerId,
  setStripeCustomerId,
  clearStripeCustomerId
} from '../billing/repository'
import { isLivemodeMismatch } from './errors'
import type { StripeUserRef } from './types'

export async function linkStripeCustomerToUser(
  stripe: Stripe,
  userId: string,
  customerId: string,
  metadata: Record<string, string> = {}
): Promise<void> {
  const conflict = await prisma.userBilling.findFirst({
    where: { stripeCustomerId: customerId, NOT: { userId } },
    select: { userId: true }
  })

  if (conflict) {
    throw createError({
      statusCode: 409,
      message: 'This Stripe customer is already linked to another FlowRate account'
    })
  }

  await stripe.customers.update(customerId, {
    metadata: { userId, ...metadata }
  })

  await setStripeCustomerId(userId, customerId)
}

export async function findAndLinkStripeCustomer(
  stripe: Stripe,
  user: StripeUserRef,
  metadata: Record<string, string> = {}
): Promise<string | null> {
  const storedId = await getStripeCustomerId(user.id)

  if (storedId) {
    try {
      await stripe.customers.retrieve(storedId)
      await linkStripeCustomerToUser(stripe, user.id, storedId, metadata)
      return storedId
    } catch (error) {
      if (isLivemodeMismatch(error)) {
        await clearStripeCustomerId(user.id)
      }
      // NOTE - Stored customer invalid (test vs live) — search by email below
    }
  }

  const customers = await stripe.customers.list({
    email: user.email.toLowerCase(),
    limit: 10
  })

  for (const customer of customers.data) {
    if ('deleted' in customer && customer.deleted) continue
    const metaUserId = customer.metadata?.userId
    if (metaUserId && metaUserId !== user.id) continue
    await linkStripeCustomerToUser(stripe, user.id, customer.id, metadata)
    return customer.id
  }

  return null
}

export async function ensureStripeCustomer(
  stripe: Stripe,
  user: StripeUserRef,
  metadata: Record<string, string>
): Promise<string> {
  const existing = await findAndLinkStripeCustomer(stripe, user, metadata)
  if (existing) return existing

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata
  })

  await linkStripeCustomerToUser(stripe, user.id, customer.id, metadata)
  return customer.id
}

export async function resolveUserIdFromStripeCustomer(
  stripe: Stripe,
  customerId: string
): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null

  if (customer.metadata?.userId) {
    return customer.metadata.userId
  }

  const byCustomerId = await findUserIdByStripeCustomerId(customerId)
  if (byCustomerId) {
    await linkStripeCustomerToUser(stripe, byCustomerId, customerId)
    return byCustomerId
  }

  if (customer.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: customer.email.toLowerCase() },
      select: { id: true }
    })
    if (byEmail) {
      await linkStripeCustomerToUser(stripe, byEmail.id, customerId)
      return byEmail.id
    }
  }

  return null
}
