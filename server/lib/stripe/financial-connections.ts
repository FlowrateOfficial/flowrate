import type { H3Event } from 'h3'
import type Stripe from 'stripe'
import type { AccountType } from '~/generated/prisma'
import { resolveHttpsBaseUrl } from './client'
import { linkStripeCustomerToUser, resolveUserIdFromStripeCustomer } from './customer'
import type { StripeLinkContext } from './types'

/** @see https://docs.stripe.com/financial-connections/fundamentals */
const FINANCIAL_CONNECTIONS_PERMISSIONS = ['balances', 'transactions'] as const
const FINANCIAL_CONNECTIONS_PREFETCH = ['balances', 'transactions'] as const
const FINANCIAL_CONNECTIONS_COUNTRIES = ['US'] as const

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
    where: { stripeFcAccountId: fcAccount.id },
    create: {
      userId: context.userId,
      spaceId: context.spaceId,
      name: accountNameFromFinancialConnection(fcAccount),
      institution: fcAccount.institution_name ?? undefined,
      type: mapFinancialConnectionSubcategory(fcAccount.subcategory),
      visibility: context.visibility,
      balance: balanceFromFinancialConnectionAccount(fcAccount),
      currency: 'USD',
      stripeFcAccountId: fcAccount.id,
      lastSynced: new Date()
    },
    update: {
      userId: context.userId,
      spaceId: context.spaceId,
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
