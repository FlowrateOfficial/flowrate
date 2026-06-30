// ANCHOR: Company team + business overview API contracts

export interface TeamMemberDto {
  id: string
  email: string | null
  name: string | null
  role: string
  status: string
}

export type BusinessAlertSeverity = 'info' | 'warning' | 'critical'

export interface BusinessAlertDto {
  severity: BusinessAlertSeverity
  code: string
  params?: Record<string, string | number>
}

export interface BusinessOverviewDto {
  cash: number
  monthlyBurn: number
  monthlyIncome: number
  netBurn: number
  runwayMonths: number | null
  monthlySubscriptions: number
  subscriptionWaste: number
  activeSubscriptions: number
  cloudSpend: number | null
  setup: {
    hasAccounts: boolean
    hasTransactions: boolean
    complete: boolean
    step: number
  }
  alerts: BusinessAlertDto[]
  topVendors: Array<{ name: string, amount: number }>
}
