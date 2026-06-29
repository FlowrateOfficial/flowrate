import type { AppPlan } from './billing'

export interface PlanLimits {
  /** Max linked institutions (Plaid items + one Stripe FC bundle). null = unlimited */
  bankConnections: number | null
  /** Max active space memberships. null = unlimited */
  spaces: number | null
  /** Hours between manual syncs. 0 = no throttle */
  manualSyncIntervalHours: number
  /** Household, Family, and Company spaces (Free = Independent only) */
  sharedSpaces: boolean
  /** SaaS Shield alerts, burn rate, runway, business metrics */
  saasShield: boolean
  /** Create teen / child login accounts */
  teenAccounts: boolean
  /** Cloud & developer-tool spend breakdowns */
  cloudSpendTracking: boolean
  /** Invite company team members with roles */
  companyTeam: boolean
  /** Max active members in a Company space. null = not applicable */
  companyMemberLimit: number | null
  /** Basic CSV export */
  csvExport: boolean
  /** Audit-ready export with extra fields */
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
