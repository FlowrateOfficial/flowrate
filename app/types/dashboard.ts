import type { AccountSummary, AnalyticsOverview, SubscriptionItem, TransactionRow } from '~/types/financial'

export interface DashboardStats {
  spaceType: string
  memberCount: number
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
  burnRate: number
  burnRateChange: string
  runwayMonths: number | null
  subscriptionAlerts: number
}

export interface BusinessOverview {
  cash: number
  monthlyBurn: number
  monthlyIncome: number
  netBurn: number
  runwayMonths: number | null
  monthlySubscriptions: number
  subscriptionWaste: number
  activeSubscriptions: number
  cloudSpend: number
  setup: { hasAccounts: boolean, hasTransactions: boolean, complete: boolean, step: number }
  alerts: Array<{ severity: 'info' | 'warning' | 'critical', code: string, params?: Record<string, string | number> }>
  topVendors: Array<{ name: string, amount: number }>
}

export interface TeenDashboard {
  displayName: string | null
  role: string
  learnMode: boolean
  allowanceAmount: number | null
  allowanceFrequency: string | null
  spendingLimits: unknown
  jars: Array<{
    id: string
    name: string
    balance: number
    targetAmount: number | null
    progress: number | null
  }>
  totalSaved: number
}

export interface DashboardOverview {
  stats: DashboardStats | null
  analytics: AnalyticsOverview | null
  recentTransactions: TransactionRow[]
  accounts: AccountSummary[]
  alertSubscriptions: SubscriptionItem[]
}
