import type { AccountSummary, AnalyticsOverview, SubscriptionItem, TransactionRow } from '~/types/financial'
import type { TeenDashboard } from '~/types/teen'

export interface DashboardStats {
  spaceType: string
  memberCount: number
  currency: string
  totalBalance: number
  sharedBalance: number
  personalBalance: number
  balanceChange: string
  monthlySpending: number
  spendingChange: string
  monthlyIncome: number
  incomeChange: string
  netSavings: number
  savingsChange: string
  burnRate: number | null
  burnRateChange: string | null
  runwayMonths: number | null
  subscriptionAlerts: number
}

export interface SaasAlertPreview {
  count: number
  locked: boolean
}

export interface DashboardOverviewPayload {
  stats: DashboardStats
  analytics: import('~/types/financial').AnalyticsOverview
  transactions: import('~/types/financial').TransactionsResponse
  accounts: AccountSummary[]
  alertSubscriptions: SubscriptionItem[]
  saasAlertPreview?: SaasAlertPreview
}

export type { BusinessOverviewDto as BusinessOverview } from '#shared/api/business'

export type { TeenDashboard }

export interface DashboardOverview {
  stats: DashboardStats | null
  analytics: AnalyticsOverview | null
  recentTransactions: TransactionRow[]
  accounts: AccountSummary[]
  alertSubscriptions: SubscriptionItem[]
}
