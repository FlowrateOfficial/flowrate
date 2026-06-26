import type Stripe from 'stripe'
import {
  getStripeClient,
  linkContextFromStripeCustomer,
  upsertFinancialConnectionAccount
} from '../../lib/stripe'

async function handleFinancialConnectionAccount(stripe: Stripe, fcAccount: Stripe.FinancialConnections.Account) {
  const customerId = fcAccount.account_holder?.customer
  if (!customerId || typeof customerId !== 'string') return

  const context = await linkContextFromStripeCustomer(stripe, customerId)
  if (!context) return

  await upsertFinancialConnectionAccount(fcAccount, context)
}

async function handleSubscriptionChange(stripe: Stripe, sub: Stripe.Subscription, plan: 'PRO' | 'FREE') {
  const customer = await stripe.customers.retrieve(sub.customer as string)
  if (customer.deleted) return

  const userId = customer.metadata?.userId
  if (!userId) return

  await prisma.user.update({
    where: { id: userId },
    data: { plan: plan as never }
  })
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
    throw createError({ statusCode: 503, message: 'Stripe is not configured' })
  }

  const stripe = getStripeClient(config.stripeSecretKey)
  const body = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')

  if (!body || !signature) {
    throw createError({ statusCode: 400, message: 'Missing body or signature' })
  }

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(body, signature, config.stripeWebhookSecret)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid webhook signature' })
  }

  switch (stripeEvent.type) {
    case 'financial_connections.account.created':
    case 'financial_connections.account.refreshed_balance':
    case 'financial_connections.account.reactivated': {
      const fcAccount = stripeEvent.data.object as Stripe.FinancialConnections.Account
      await handleFinancialConnectionAccount(stripe, fcAccount)
      break
    }

    case 'financial_connections.account.deactivated':
    case 'financial_connections.account.disconnected': {
      const fcAccount = stripeEvent.data.object as Stripe.FinancialConnections.Account
      await prisma.account.deleteMany({
        where: { stripeFinancialConnId: fcAccount.id }
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = stripeEvent.data.object as Stripe.Subscription
      const plan = sub.status === 'active' ? 'PRO' : 'FREE'
      await handleSubscriptionChange(stripe, sub, plan)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = stripeEvent.data.object as Stripe.Subscription
      await handleSubscriptionChange(stripe, sub, 'FREE')
      break
    }
  }

  return { received: true }
})
