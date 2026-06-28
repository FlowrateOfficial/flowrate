import type Stripe from 'stripe'
import {
  appPlanFromBillingStatus,
  billingStatusFromStripe,
  type AppPlan
} from '#shared/billing'
import { findAndLinkStripeCustomer, linkStripeCustomerToUser } from '../stripe'
import { extractStripeId } from '../stripe/client'
import { resolveUserIdFromStripeCustomer } from '../stripe/customer'
import { formatPlanPrice, listStripePlans, resolveStripePriceId, type StripePlan } from './plans'
import { ensureBillingProfile, getUserBillingSnapshot, setUserPlan } from './repository'

const PAID_STRIPE_STATUSES = new Set<Stripe.Subscription.Status>(['active', 'trialing', 'past_due'])

function priceIdFromSubscription(sub: Stripe.Subscription): string {
  const item = sub.items.data[0]
  if (!item?.price?.id) {
    throw createError({ statusCode: 500, message: 'Subscription has no price item' })
  }
  return item.price.id
}

function productIdFromSubscription(sub: Stripe.Subscription): string | null {
  const product = sub.items.data[0]?.price?.product
  if (!product) return null
  return typeof product === 'string' ? product : product.id
}

function periodDate(unix: number | null | undefined): Date | null {
  return unix != null ? new Date(unix * 1000) : null
}

function subscriptionPeriod(sub: Stripe.Subscription): { start: Date | null, end: Date | null } {
  const item = sub.items.data[0]
  return {
    start: periodDate(item?.current_period_start),
    end: periodDate(item?.current_period_end)
  }
}

export async function upsertBillingSubscription(
  userId: string,
  sub: Stripe.Subscription
): Promise<AppPlan> {
  await ensureBillingProfile(userId)

  const status = billingStatusFromStripe(sub.status)
  const plan = appPlanFromBillingStatus(status)
  const period = subscriptionPeriod(sub)

  await prisma.billingSubscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceIdFromSubscription(sub),
      stripeProductId: productIdFromSubscription(sub),
      status,
      planKey: sub.metadata?.planKey ?? null,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: periodDate(sub.canceled_at)
    },
    update: {
      stripeSubscriptionId: sub.id,
      stripePriceId: priceIdFromSubscription(sub),
      stripeProductId: productIdFromSubscription(sub),
      status,
      planKey: sub.metadata?.planKey ?? null,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: periodDate(sub.canceled_at)
    }
  })

  await setUserPlan(userId, plan)
  return plan
}

export async function clearBillingSubscription(userId: string): Promise<AppPlan> {
  await prisma.billingSubscription.deleteMany({ where: { userId } })
  await setUserPlan(userId, 'FREE')
  return 'FREE'
}

export { PAID_STRIPE_STATUSES }

export async function syncUserPlanFromStripe(
  stripe: Stripe,
  userId: string
): Promise<AppPlan> {
  const snapshot = await getUserBillingSnapshot(userId)
  if (!snapshot) return 'FREE'

  let customerId = snapshot.stripeCustomerId
    ?? await findAndLinkStripeCustomer(stripe, { id: userId, email: snapshot.email, name: snapshot.name })

  if (!customerId) {
    if (snapshot.plan !== 'FREE') await setUserPlan(userId, 'FREE')
    return 'FREE'
  }

  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 10
  })

  const activeSub = subs.data.find(s => PAID_STRIPE_STATUSES.has(s.status))

  if (activeSub) {
    return upsertBillingSubscription(userId, activeSub)
  }

  const latestSub = subs.data[0]
  if (latestSub) {
    return upsertBillingSubscription(userId, latestSub)
  }

  await clearBillingSubscription(userId)
  return 'FREE'
}

export async function syncPlanFromCheckoutSession(
  stripe: Stripe,
  userId: string,
  sessionId: string
): Promise<AppPlan> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription']
  })

  if (session.metadata?.userId && session.metadata.userId !== userId) {
    throw createError({ statusCode: 403, message: 'Checkout session belongs to another user' })
  }

  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  const customerId = extractStripeId(session.customer)

  if (customerId) {
    await linkStripeCustomerToUser(stripe, userId, customerId, {
      ...(session.metadata?.planKey ? { planKey: session.metadata.planKey } : {})
    })
  }

  if (session.mode === 'subscription' && paid) {
    const subscription = session.subscription
    if (subscription && typeof subscription !== 'string') {
      return upsertBillingSubscription(userId, subscription)
    }

    if (typeof subscription === 'string') {
      const sub = await stripe.subscriptions.retrieve(subscription)
      return upsertBillingSubscription(userId, sub)
    }

    await setUserPlan(userId, 'PRO')
    return 'PRO'
  }

  return syncUserPlanFromStripe(stripe, userId)
}

export async function processStripeSubscriptionEvent(
  stripe: Stripe,
  sub: Stripe.Subscription
): Promise<void> {
  const customerId = extractStripeId(sub.customer)
  if (!customerId) return

  const userId = sub.metadata?.userId
    ?? await resolveUserIdFromStripeCustomer(stripe, customerId)

  if (!userId) return

  if (sub.status === 'canceled' || sub.status === 'incomplete_expired') {
    await clearBillingSubscription(userId)
    return
  }

  await upsertBillingSubscription(userId, sub)
}

export async function processCheckoutSessionCompleted(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId
  if (!userId || session.mode !== 'subscription') return
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') return

  const customerId = extractStripeId(session.customer)
  if (customerId) {
    await linkStripeCustomerToUser(stripe, userId, customerId, {
      ...(session.metadata?.planKey ? { planKey: session.metadata.planKey } : {})
    })
  }

  const subscriptionId = extractStripeId(session.subscription)
  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    await upsertBillingSubscription(userId, sub)
    return
  }

  await setUserPlan(userId, 'PRO')
}

export {
  formatPlanPeriod,
  formatPlanPrice,
  listStripePlans,
  resolveStripePriceId,
  type StripePlan
} from './plans'

export {
  getStripeCustomerId,
  getUserBillingSnapshot,
  getUserPlan
} from './repository'

export type { AppPlan } from '#shared/billing'
