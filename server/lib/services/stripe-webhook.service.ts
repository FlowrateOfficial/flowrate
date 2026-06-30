// ANCHOR: Stripe webhook event processing
import type Stripe from 'stripe'
import {
  linkContextFromStripeCustomer,
  upsertFinancialConnectionAccount
} from '../stripe'
import {
  processCheckoutSessionCompleted,
  processStripeSubscriptionEvent
} from '../billing'
import { allowsWebhookSync, userPlanForId } from '../billing/enforcement'
import { syncAccountTransactions, syncSpaceSubscriptions } from '../transactionSync'
import { deferTask } from '../jobs/defer'
import {
  deleteAccountsByStripeId,
  findAccountByStripeId
} from '../repositories/space.repository'

async function handleFinancialConnectionAccount(stripe: Stripe, fcAccount: Stripe.FinancialConnections.Account) {
  const customerId = fcAccount.account_holder?.customer
  if (!customerId || typeof customerId !== 'string') return

  const context = await linkContextFromStripeCustomer(stripe, customerId)
  if (!context) return

  await upsertFinancialConnectionAccount(stripe, fcAccount, context)
}

async function syncStripeAccountIfAllowed(stripe: Stripe, fcAccount: Stripe.FinancialConnections.Account) {
  const customerId = fcAccount.account_holder?.customer
  if (!customerId || typeof customerId !== 'string') return

  const context = await linkContextFromStripeCustomer(stripe, customerId)
  if (!context) return

  const plan = await userPlanForId(context.userId)
  if (!allowsWebhookSync(plan)) return

  const dbAccount = await findAccountByStripeId(fcAccount.id)
  if (!dbAccount) return

  deferTask('stripe-sync', async () => {
    await syncAccountTransactions(stripe, dbAccount)
    await syncSpaceSubscriptions(context.spaceId, context.userId)
  })
}

export async function processStripeWebhookEvent(
  stripe: Stripe,
  stripeEvent: Stripe.Event
) {
  switch (stripeEvent.type) {
    case 'financial_connections.account.created':
    case 'financial_connections.account.refreshed_balance':
    case 'financial_connections.account.reactivated':
    case 'financial_connections.account.refreshed_transactions': {
      const fcAccount = stripeEvent.data.object as Stripe.FinancialConnections.Account
      await handleFinancialConnectionAccount(stripe, fcAccount)
      await syncStripeAccountIfAllowed(stripe, fcAccount)
      break
    }

    case 'financial_connections.account.deactivated':
    case 'financial_connections.account.disconnected': {
      const fcAccount = stripeEvent.data.object as Stripe.FinancialConnections.Account
      await deleteAccountsByStripeId(fcAccount.id)
      break
    }

    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      await processCheckoutSessionCompleted(stripe, session)
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = stripeEvent.data.object as Stripe.Subscription
      await processStripeSubscriptionEvent(stripe, sub)
      break
    }
  }
}

export function constructStripeWebhookEvent(
  stripe: import('stripe').default,
  body: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  return stripe.webhooks.constructEvent(body, signature, webhookSecret)
}
