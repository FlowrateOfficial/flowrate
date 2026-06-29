import type { AppPlan } from '#shared/billing'

export interface AdminUsageRow {
  userId: string
  email: string
  name: string | null
  plan: AppPlan
  bankConnections: number
  accountCount: number
  transactionCount: number
  syncsThisMonth: number
  lastSyncAt: string | null
  createdAt: string
}

export interface AdminUsageTotals {
  users: number
  paidUsers: number
  bankConnections: number
  accounts: number
  transactions: number
  syncsThisMonth: number
}
