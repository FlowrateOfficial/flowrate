import type Stripe from 'stripe'
import {
  getStripeClient,
  linkContextFromStripeCustomer,
  upsertFinancialConnectionAccount
} from '../../lib/stripe'
import {
  processCheckoutSessionCompleted,
  processStripeSubscriptionEvent
} from '../../lib/billing'
import { syncAccountTransactions, syncSpaceSubscriptions } from '../../lib/transactionSync'

async function handleFinancialConnectionAccount(stripe: Stripe, fcAccount: Stripe.FinancialConnections.Account) {
  const customerId = fcAccount.account_holder?.customer
  if (!customerId || typeof customerId !== 'string') return

  const context = await linkContextFromStripeCustomer(stripe, customerId)
  if (!context) return

  await upsertFinancialConnectionAccount(fcAccount, context)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
    console.error(
      '[stripe/webhook] 503 — set STRIPE_WEBHOOK_SECRET in .env (run `pnpm stripe:listen` and copy the whsec_… value), then restart `pnpm dev`.'
    )
    throw createError({ statusCode: 503, message: 'Stripe webhook secret is not configured' })
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
    case 'financial_connections.account.reactivated':
    case 'financial_connections.account.refreshed_transactions': {
      const fcAccount = stripeEvent.data.object as Stripe.FinancialConnections.Account
      await handleFinancialConnectionAccount(stripe, fcAccount)

      const customerId = fcAccount.account_holder?.customer
      if (customerId && typeof customerId === 'string') {
        const context = await linkContextFromStripeCustomer(stripe, customerId)
        if (context) {
          const dbAccount = await prisma.account.findUnique({
            where: { stripeFcAccountId: fcAccount.id }
          })
          if (dbAccount) {
            await syncAccountTransactions(stripe, dbAccount)
            await syncSpaceSubscriptions(context.spaceId, context.userId)
          }
        }
      }
      break
    }

    case 'financial_connections.account.deactivated':
    case 'financial_connections.account.disconnected': {
      const fcAccount = stripeEvent.data.object as Stripe.FinancialConnections.Account
      await prisma.account.deleteMany({
        where: { stripeFcAccountId: fcAccount.id }
      })
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

  return { received: true }
})
