import type { AppPlan } from './billing'

export interface PlanLimits {
  // NOTE - Max linked banks (Plaid + one Stripe FC); null = unlimited
  bankConnections: number | null
  // NOTE - Max active space memberships; null = unlimited
  spaces: number | null
  // NOTE - Hours between manual syncs; 0 = no throttle
  manualSyncIntervalHours: number
  // NOTE - Household/Family/Company spaces (Free = Independent only)
  sharedSpaces: boolean
  // NOTE - SaaS Shield, burn rate, runway, business metrics
  saasShield: boolean
  // NOTE - Teen / child login accounts
  teenAccounts: boolean
  // NOTE - Cloud and developer-tool spend breakdowns
  cloudSpendTracking: boolean
  // NOTE - Company team invites with roles
  companyTeam: boolean
  // NOTE - Max Company space members; null = N/A
  companyMemberLimit: number | null
  // NOTE - Basic CSV export
  csvExport: boolean
  // NOTE - Audit-ready export with extra fields
  auditExport: boolean
}

export const PLAN_LIMITS: Record<AppPlan, PlanLimits> = {
  FREE: {
    bankConnections: 1,
    spaces: 1,
    manualSyncIntervalHours: 24,
    sharedSpaces: false,
    saasShield: false,
    teenAccounts: false,
    cloudSpendTracking: false,
    companyTeam: false,
    companyMemberLimit: null,
    csvExport: true,
    auditExport: false
  },
  PRO: {
    bankConnections: null,
    spaces: null,
    manualSyncIntervalHours: 0,
    sharedSpaces: true,
    saasShield: true,
    teenAccounts: true,
    cloudSpendTracking: true,
    companyTeam: false,
    companyMemberLimit: 1,
    csvExport: true,
    auditExport: false
  },
  ENTERPRISE: {
    bankConnections: null,
    spaces: null,
    manualSyncIntervalHours: 0,
    sharedSpaces: true,
    saasShield: true,
    teenAccounts: true,
    cloudSpendTracking: true,
    companyTeam: true,
    companyMemberLimit: 10,
    csvExport: true,
    auditExport: true
  }
}

export type PlanFeature =
  | 'sharedSpaces'
  | 'saasShield'
  | 'teenAccounts'
  | 'cloudSpendTracking'
  | 'companyTeam'
  | 'auditExport'
  | 'csvExport'

export function limitsForPlan(plan: AppPlan): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function planHasFeature(plan: AppPlan, feature: PlanFeature): boolean {
  const limits = limitsForPlan(plan)
  switch (feature) {
    case 'sharedSpaces': return limits.sharedSpaces
    case 'saasShield': return limits.saasShield
    case 'teenAccounts': return limits.teenAccounts
    case 'cloudSpendTracking': return limits.cloudSpendTracking
    case 'companyTeam': return limits.companyTeam
    case 'auditExport': return limits.auditExport
    case 'csvExport': return limits.csvExport
    default: return false
  }
}
