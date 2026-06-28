// ANCHOR: Financial Connections — bank link sessions, account sync, subscriptions
import type { H3Event } from 'h3'
import type Stripe from 'stripe'
import type { AccountType } from '~~/generated/prisma'
import {
  FINANCIAL_CONNECTIONS_BANK_COUNTRIES,
  FINANCIAL_CONNECTIONS_PERMISSIONS,
  FINANCIAL_CONNECTIONS_PREFETCH
} from '#shared/stripe-financial-connections'
import { linkStripeCustomerToUser, resolveUserIdFromStripeCustomer } from './customer'
import type { StripeLinkContext } from './types'

export {
  FINANCIAL_CONNECTIONS_BANK_COUNTRIES,
  FINANCIAL_CONNECTIONS_BUSINESS_COUNTRIES,
  FINANCIAL_CONNECTIONS_DOCS_URL,
  FINANCIAL_CONNECTIONS_PERMISSIONS,
  FINANCIAL_CONNECTIONS_PREFETCH
} from '#shared/stripe-financial-connections'

function pickPrimaryCurrencyAmount(
  amounts: Record<string, number> | null | undefined
): { currency: string, cents: number } | null {
  if (!amounts) return null

  let best: { currency: string, cents: number } | null = null
  for (const [currency, cents] of Object.entries(amounts)) {
    if (!best || Math.abs(cents) > Math.abs(best.cents)) {
      best = { currency, cents }
    }
  }
  return best
}

export async function createBankLinkSession(
  stripe: Stripe,
  event: H3Event,
  appUrl: string,
  customerId: string,
  context: StripeLinkContext
) {
  void event
  void appUrl
  void context

  // NOTE - Web uses collectFinancialConnectionsAccounts modal; return_url is mobile webview only
  return stripe.financialConnections.sessions.create({
    account_holder: {
      type: 'customer',
      customer: customerId
    },
    permissions: [...FINANCIAL_CONNECTIONS_PERMISSIONS],
    prefetch: [...FINANCIAL_CONNECTIONS_PREFETCH],
    filters: { countries: [...FINANCIAL_CONNECTIONS_BANK_COUNTRIES] }
  })
}

export function mapFinancialConnectionSubcategory(
  account: Pick<Stripe.FinancialConnections.Account, 'category' | 'subcategory'>
): AccountType {
  if (account.category === 'credit') return 'CREDIT'
  if (account.category === 'investment') return 'INVESTMENT'

  switch (account.subcategory) {
    case 'checking':
      return 'CHECKING'
    case 'savings':
      return 'SAVINGS'
    case 'credit_card':
    case 'line_of_credit':
    case 'mortgage':
      return 'CREDIT'
    default:
      return 'CHECKING'
  }
}

export function balanceFromFinancialConnectionAccount(account: Stripe.FinancialConnections.Account): number {
  return balanceAndCurrencyFromFinancialConnectionAccount(account).balance
}

export function balanceAndCurrencyFromFinancialConnectionAccount(
  account: Stripe.FinancialConnections.Account
): { balance: number, currency: string } {
  const balance = account.balance
  if (!balance) return { balance: 0, currency: 'USD' }

  const cashAvailable = pickPrimaryCurrencyAmount(balance.cash?.available)
  if (cashAvailable) {
    return {
      balance: cashAvailable.cents / 100,
      currency: cashAvailable.currency.toUpperCase()
    }
  }

  const creditUsed = pickPrimaryCurrencyAmount(balance.credit?.used)
  if (creditUsed) {
    return {
      balance: -(creditUsed.cents / 100),
      currency: creditUsed.currency.toUpperCase()
    }
  }

  const current = pickPrimaryCurrencyAmount(balance.current)
  if (current) {
    return {
      balance: current.cents / 100,
      currency: current.currency.toUpperCase()
    }
  }

  return { balance: 0, currency: 'USD' }
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

export async function ensureFinancialConnectionSubscriptions(
  stripe: Stripe,
  fcAccountId: string
) {
  try {
    await stripe.financialConnections.accounts.subscribe(fcAccountId, {
      features: ['transactions']
    })
  } catch {
    // NOTE - Already subscribed or unavailable in current Stripe mode
  }
}

export async function refreshFinancialConnectionAccount(
  stripe: Stripe,
  fcAccountId: string
): Promise<Stripe.FinancialConnections.Account> {
  try {
    return await stripe.financialConnections.accounts.refresh(fcAccountId, {
      features: ['balance', 'transactions']
    })
  } catch {
    return stripe.financialConnections.accounts.retrieve(fcAccountId)
  }
}

export async function upsertFinancialConnectionAccount(
  stripe: Stripe,
  fcAccount: Stripe.FinancialConnections.Account,
  context: StripeLinkContext
) {
  if (fcAccount.status === 'disconnected') {
    await prisma.account.deleteMany({
      where: { stripeFcAccountId: fcAccount.id }
    })
    return null
  }

  const { balance, currency } = balanceAndCurrencyFromFinancialConnectionAccount(fcAccount)

  const record = await prisma.account.upsert({
    where: { stripeFcAccountId: fcAccount.id },
    create: {
      userId: context.userId,
      spaceId: context.spaceId,
      name: accountNameFromFinancialConnection(fcAccount),
      institution: fcAccount.institution_name ?? undefined,
      type: mapFinancialConnectionSubcategory(fcAccount),
      visibility: context.visibility,
      balance,
      currency,
      stripeFcAccountId: fcAccount.id,
      lastSynced: new Date()
    },
    update: {
      userId: context.userId,
      spaceId: context.spaceId,
      name: accountNameFromFinancialConnection(fcAccount),
      institution: fcAccount.institution_name ?? undefined,
      type: mapFinancialConnectionSubcategory(fcAccount),
      visibility: context.visibility,
      balance,
      currency,
      lastSynced: new Date()
    }
  })

  await ensureFinancialConnectionSubscriptions(stripe, fcAccount.id)
  return record
}

export async function linkContextFromStripeCustomer(
  stripe: Stripe,
  customerId: string
): Promise<StripeLinkContext | null> {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null

  const userId = await resolveUserIdFromStripeCustomer(stripe, customerId)
  if (!userId) return null

  const spaceId = customer.metadata?.spaceId
    ?? (await prisma.user.findUnique({ where: { id: userId }, select: { activeSpaceId: true } }))?.activeSpaceId
    ?? (await prisma.spaceMember.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: { spaceId: true },
      orderBy: { joinedAt: 'asc' }
    }))?.spaceId

  if (!spaceId) return null

  if (!customer.metadata?.userId) {
    await linkStripeCustomerToUser(stripe, userId, customerId, {
      ...(spaceId ? { spaceId } : {})
    })
  }

  return {
    userId,
    spaceId,
    visibility: customer.metadata?.visibility === 'SHARED' ? 'SHARED' : 'PERSONAL'
  }
}
