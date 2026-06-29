import type Stripe from 'stripe'
import type { AppPlan } from '#shared/billing'
import { requireStripe } from '../stripe'
import { currentBillingInterval, prorationNetCents } from './proration'
import { PAID_STRIPE_STATUSES, resolveStripePriceId, upsertBillingSubscription } from './subscription'
import { getUserBillingSnapshot } from './repository'

export interface SubscriptionChangeRequest {
  planKey: string
  interval: 'month' | 'year'
}

export interface SubscriptionChangePreview {
  unchanged: boolean
  amountDue: number
  currency: string
  isCredit: boolean
  planKey: string
  interval: 'month' | 'year'
  currentPriceId: string | null
  targetPriceId: string
}

async function loadActiveSubscription(stripe: Stripe, userId: string) {
  const snapshot = await getUserBillingSnapshot(userId)
  const subId = snapshot?.subscription?.subId
  const customerId = snapshot?.customerId

  if (!subId || !customerId) {
    throw createError({ statusCode: 404, message: 'No active subscription found' })
  }

  const sub = await stripe.subscriptions.retrieve(subId)
  if (!PAID_STRIPE_STATUSES.has(sub.status)) {
    throw createError({ statusCode: 400, message: 'Subscription is not active' })
  }

  const item = sub.items.data[0]
  if (!item?.id) {
    throw createError({ statusCode: 500, message: 'Subscription has no price item' })
  }

  return { snapshot, sub, item, customerId }
}

async function resolveTargetPriceId(
  stripe: Stripe,
  event: Parameters<typeof requireStripe>[0],
  request: SubscriptionChangeRequest
) {
  const { config } = requireStripe(event)
  return resolveStripePriceId(stripe, {
    planKey: request.planKey,
    interval: request.interval,
    fallbackPriceId: request.planKey === 'pro' ? config.stripePricePro || undefined : undefined
  })
}

export async function previewSubscriptionChange(
  stripe: Stripe,
  event: Parameters<typeof requireStripe>[0],
  userId: string,
  request: SubscriptionChangeRequest
): Promise<SubscriptionChangePreview> {
  const planKey = request.planKey.trim().toLowerCase()
  const { item, customerId, sub } = await loadActiveSubscription(stripe, userId)
  const targetPriceId = await resolveTargetPriceId(stripe, event, { planKey, interval: request.interval })
  const currentPriceId = item.price?.id ?? null

  if (currentPriceId === targetPriceId) {
    return {
      unchanged: true,
      amountDue: 0,
      currency: (item.price?.currency ?? 'usd').toUpperCase(),
      isCredit: false,
      planKey,
      interval: request.interval,
      currentPriceId,
      targetPriceId
    }
  }

  const currentInterval = currentBillingInterval(item.price)
  const sameInterval = currentInterval === request.interval
  const prorationDate = Math.floor(Date.now() / 1000)

  const invoice = await stripe.invoices.createPreview({
    customer: customerId,
    subscription: sub.id,
    subscription_details: {
      items: [{ id: item.id, price: targetPriceId }],
      proration_behavior: 'create_prorations',
      proration_date: prorationDate,
      ...(sameInterval ? { billing_cycle_anchor: 'unchanged' } : {})
    }
  })

  const { amountCents, hasProrationLines } = prorationNetCents(invoice)
  const netCents = hasProrationLines ? amountCents : invoice.amount_due

  return {
    unchanged: false,
    amountDue: Math.abs(netCents) / 100,
    currency: invoice.currency.toUpperCase(),
    isCredit: netCents < 0,
    planKey,
    interval: request.interval,
    currentPriceId,
    targetPriceId
  }
}

export async function changeUserSubscription(
  stripe: Stripe,
  event: Parameters<typeof requireStripe>[0],
  userId: string,
  request: SubscriptionChangeRequest
): Promise<{ plan: AppPlan, unchanged: boolean, planKey: string, interval: 'month' | 'year' }> {
  const planKey = request.planKey.trim().toLowerCase()
  const { item, sub } = await loadActiveSubscription(stripe, userId)
  const targetPriceId = await resolveTargetPriceId(stripe, event, { planKey, interval: request.interval })

  if (item.price?.id === targetPriceId) {
    const snapshot = await getUserBillingSnapshot(userId)
    return {
      plan: snapshot?.plan ?? 'FREE',
      unchanged: true,
      planKey,
      interval: request.interval
    }
  }

  const currentInterval = currentBillingInterval(item.price)
  const sameInterval = currentInterval === request.interval
  const prorationDate = Math.floor(Date.now() / 1000)

  const updated = await stripe.subscriptions.update(sub.id, {
    items: [{ id: item.id, price: targetPriceId }],
    proration_behavior: 'create_prorations',
    proration_date: prorationDate,
    ...(sameInterval ? { billing_cycle_anchor: 'unchanged' } : {}),
    payment_behavior: 'pending_if_incomplete',
    metadata: {
      userId,
      planKey
    }
  })

  const plan = await upsertBillingSubscription(userId, updated)
  return { plan, unchanged: false, planKey, interval: request.interval }
}
