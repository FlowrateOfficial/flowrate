import type { H3Event } from 'h3'
import Stripe from 'stripe'
import type { AccountType, AccountVisibility } from '@prisma/client'

/** @see https://docs.stripe.com/financial-connections/fundamentals */
const FINANCIAL_CONNECTIONS_PERMISSIONS = ['balances', 'transactions'] as const
const FINANCIAL_CONNECTIONS_PREFETCH = ['balances', 'transactions'] as const
const FINANCIAL_CONNECTIONS_COUNTRIES = ['US'] as const

export interface StripeLinkContext {
  userId: string
  spaceId: string
  visibility: AccountVisibility
}

export function getStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey)
}

export function requireStripe(event: H3Event) {
  const config = useRuntimeConfig(event)
  const secretKey = config.stripeSecretKey

  if (!secretKey) {
    throw createError({ statusCode: 503, message: 'Stripe is not configured' })
  }

  return {
    config,
    stripe: getStripeClient(secretKey)
  }
}

/** Financial Connections `return_url` must be HTTPS — omit on local HTTP dev. */
export function resolveHttpsBaseUrl(event: H3Event, appUrl: string): string | null {
  const candidates = [
    appUrl.replace(/\/$/, ''),
    getRequestURL(event).origin.replace(/\/$/, '')
  ]

  return candidates.find(url => url.startsWith('https://')) ?? null
}

export async function ensureStripeCustomer(
  stripe: Stripe,
  user: { id: string, email: string, name: string | null },
  context: StripeLinkContext
): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true }
  })

  const metadata = {
    userId: context.userId,
    spaceId: context.spaceId,
    visibility: context.visibility
  }

  if (existing?.stripeCustomerId) {
    try {
      await stripe.customers.retrieve(existing.stripeCustomerId)
      await stripe.customers.update(existing.stripeCustomerId, { metadata })
      return existing.stripeCustomerId
    } catch {
      // Customer was created in the other mode (test vs live) — recreate below.
    }
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id }
  })

  return customer.id
}

export async function createBankLinkSession(
  stripe: Stripe,
  event: H3Event,
  appUrl: string,
  customerId: string,
  context: StripeLinkContext
) {
  const httpsBase = resolveHttpsBaseUrl(event, appUrl)

  return stripe.financialConnections.sessions.create({
    account_holder: {
      type: 'customer',
      customer: customerId
    },
    permissions: [...FINANCIAL_CONNECTIONS_PERMISSIONS],
    prefetch: [...FINANCIAL_CONNECTIONS_PREFETCH],
    filters: { countries: [...FINANCIAL_CONNECTIONS_COUNTRIES] },
    ...(httpsBase
      ? { return_url: `${httpsBase}/dashboard/accounts?visibility=${context.visibility}&spaceId=${context.spaceId}` }
      : {})
  })
}

export function mapFinancialConnectionSubcategory(subcategory: string | null | undefined): AccountType {
  switch (subcategory) {
    case 'checking':
      return 'CHECKING'
    case 'savings':
    case 'money_market':
      return 'SAVINGS'
    case 'credit_card':
    case 'line_of_credit':
    case 'mortgage':
      return 'CREDIT'
    case 'investment':
    case 'brokerage':
      return 'INVESTMENT'
    default:
      return 'CHECKING'
  }
}

export function balanceFromFinancialConnectionAccount(account: Stripe.FinancialConnections.Account): number {
  const balance = account.balance
  if (!balance) return 0

  const cashUsd = balance.cash?.available?.usd
  if (cashUsd != null) return cashUsd / 100

  const creditUsd = balance.credit?.used?.usd
  if (creditUsd != null) return -(creditUsd / 100)

  return 0
}

export function accountNameFromFinancialConnection(account: Stripe.FinancialConnections.Account): string {
  return account.display_name
    ?? account.institution_name
    ?? 'Bank account'
}

export function assertFinancialConnectionOwnership(
  fcAccount: Stripe.FinancialConnections.Account,
  expectedCustomerId: string
) {
  const holderCustomer = fcAccount.account_holder?.customer
  if (holderCustomer !== expectedCustomerId) {
    throw createError({ statusCode: 403, message: 'Bank account does not belong to this user' })
  }
}

export async function upsertFinancialConnectionAccount(
  fcAccount: Stripe.FinancialConnections.Account,
  context: StripeLinkContext
) {
  return prisma.account.upsert({
    where: { stripeFinancialConnId: fcAccount.id },
    create: {
      userId: context.userId,
      spaceId: context.spaceId,
      name: accountNameFromFinancialConnection(fcAccount),
      institution: fcAccount.institution_name ?? undefined,
      type: mapFinancialConnectionSubcategory(fcAccount.subcategory),
      visibility: context.visibility,
      balance: balanceFromFinancialConnectionAccount(fcAccount),
      currency: 'USD',
      stripeFinancialConnId: fcAccount.id,
      lastSynced: new Date()
    },
    update: {
      name: accountNameFromFinancialConnection(fcAccount),
      institution: fcAccount.institution_name ?? undefined,
      type: mapFinancialConnectionSubcategory(fcAccount.subcategory),
      visibility: context.visibility,
      balance: balanceFromFinancialConnectionAccount(fcAccount),
      lastSynced: new Date()
    }
  })
}

export async function linkContextFromStripeCustomer(
  stripe: Stripe,
  customerId: string
): Promise<StripeLinkContext | null> {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null

  const userId = customer.metadata?.userId
  const spaceId = customer.metadata?.spaceId
  if (!userId || !spaceId) return null

  return {
    userId,
    spaceId,
    visibility: customer.metadata?.visibility === 'SHARED' ? 'SHARED' : 'PERSONAL'
  }
}
