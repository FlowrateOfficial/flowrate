export interface AccountSummary {
  id: string
  name: string
  institution: string | null
  type: string
  visibility: 'PERSONAL' | 'SHARED'
  balance: number
  currency: string
  syncedAt: string | null
  isMine: boolean
  ownerName: string | null
}

export type {
  TransactionAccountRef,
  TransactionListItem,
  TransactionListResponse
} from '#shared/api/transactions'

import type { TransactionListItem, TransactionListResponse } from '#shared/api/transactions'

export type TransactionRow = TransactionListItem
export type TransactionsResponse = TransactionListResponse

export type AnalyticsRange = '7d' | '30d' | '90d' | '12m'

export interface SubscriptionItem {
  id: string
  name: string
  amount: number
  currency: string
  frequency: string | null
  status: string
  icon: string | null
  lastCharge: string | null
  nextCharge: string | null
  alert: boolean
  isDuplicate: boolean
}

export interface AnalyticsOverview {
  range: AnalyticsRange
  summary: {
    totalBalance: number
    income: number
    spending: number
    net: number
    savingsRate: number
    transactionCount: number
    linkedAccountCount: number
    currency: string
  }
  cashFlow: Array<{ period: string, income: number, spending: number }>
  categories: Array<{ category: string, amount: number }>
  netWorth: Array<{ period: string, balance: number }>
  topMerchants: Array<{ name: string, amount: number }>
}
