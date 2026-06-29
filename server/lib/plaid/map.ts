// ANCHOR: Plaid → FlowRate account/transaction mapping
import type { AccountBase, AccountSubtype, AccountType as PlaidAccountType, Transaction } from 'plaid'
import type { AccountType, TransactionCategory } from '~~/generated/prisma/client'
import { categorizeTransaction, extractMerchant } from '../../utils/transactions'

export function mapPlaidAccountType(
  type: PlaidAccountType,
  subtype: AccountSubtype | null
): AccountType {
  if (type === 'credit') return 'CREDIT'
  if (type === 'investment' || type === 'brokerage') return 'INVESTMENT'
  if (type === 'loan') return 'CREDIT'

  switch (subtype) {
    case 'savings':
    case 'money market':
    case 'cd':
      return 'SAVINGS'
    case 'checking':
    default:
      return 'CHECKING'
  }
}

export function accountNameFromPlaid(account: AccountBase, institution?: string | null): string {
  return account.name
    ?? account.official_name
    ?? institution
    ?? 'Bank account'
}

export function balanceFromPlaidAccount(account: AccountBase): { balance: number, currency: string } {
  const balances = account.balances
  const raw = balances.current ?? balances.available ?? 0
  return {
    balance: raw,
    currency: (balances.iso_currency_code ?? balances.unofficial_currency_code ?? 'EUR').toUpperCase()
  }
}

function mapPlaidCategory(tx: Transaction): TransactionCategory {
  const primary = tx.personal_finance_category?.primary
  if (!primary) {
    return categorizeTransaction(tx.name, tx.merchant_name)
  }

  const rules: Record<string, TransactionCategory> = {
    FOOD_AND_DRINK: 'FOOD',
    TRANSPORTATION: 'TRANSPORT',
    RENT_AND_UTILITIES: 'UTILITIES',
    GENERAL_MERCHANDISE: 'SHOPPING',
    ENTERTAINMENT: 'ENTERTAINMENT',
    MEDICAL: 'HEALTHCARE',
    TRAVEL: 'ENTERTAINMENT',
    PERSONAL_CARE: 'HEALTHCARE',
    GENERAL_SERVICES: 'SUBSCRIPTIONS',
    HOME_IMPROVEMENT: 'HOUSING',
    INCOME: 'INCOME',
    TRANSFER_IN: 'INCOME',
    TRANSFER_OUT: 'OTHER',
    LOAN_PAYMENTS: 'HOUSING',
    BANK_FEES: 'OTHER'
  }

  return rules[primary] ?? categorizeTransaction(tx.name, tx.merchant_name)
}

export function mapPlaidTransaction(tx: Transaction) {
  const description = tx.merchant_name ?? tx.name ?? 'Bank transaction'
  const merchant = tx.merchant_name ?? extractMerchant(description)

  return {
    // NOTE - Plaid positive = outflow; FlowRate negative = expense
    amount: tx.amount > 0 ? -tx.amount : Math.abs(tx.amount),
    currency: (tx.iso_currency_code ?? tx.unofficial_currency_code ?? 'EUR').toUpperCase(),
    description,
    merchant,
    category: mapPlaidCategory(tx),
    date: new Date(tx.date),
    pending: tx.pending
  }
}
