export interface AccountSummary {
  id: string
  name: string
  institution: string | null
  type: string
  visibility: 'PERSONAL' | 'SHARED'
  balance: number
  currency: string
  lastSynced: string | null
  isMine: boolean
  ownerName: string | null
}

export interface TransactionRow {
  id: string
  description: string
  merchant: string | null
  amount: number
  currency: string
  category: string
  date: string
  pending: boolean
  account: { id: string, name: string } | null
}

export interface TransactionsResponse {
  items: TransactionRow[]
  total: number
  page: number
  pages: number
}

export type AnalyticsRange = '7d' | '30d' | '90d' | '12m'

export interface SubscriptionItem {
  id: string
  name: string
  amount: number
  currency: string
  frequency: string | null
  status: string
  icon: string | null
  lastCharged: string | null
  nextCharge: string | null
  priceAlert: boolean
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
  }
  cashFlow: Array<{ period: string, income: number, spending: number }>
  categories: Array<{ category: string, amount: number }>
  netWorth: Array<{ period: string, balance: number }>
  topMerchants: Array<{ name: string, amount: number }>
}
