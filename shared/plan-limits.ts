import type { AppPlan } from './billing'

export interface PlanLimits {
  // NOTE - max banks; null = unlimited
  bankConnections: number | null
  // NOTE - max spaces; null = unlimited
  spaces: number | null
  // NOTE - manual sync cooldown (hours); 0 = off
  manualSyncIntervalHours: number
  // NOTE - shared space types (HH/Family/Co)
  sharedSpaces: boolean
  // NOTE - SaaS Shield + company metrics
  saasShield: boolean
  // NOTE - teen/child logins
  teenAccounts: boolean
  // NOTE - cloud/dev spend breakdown
  cloudSpendTracking: boolean
  // NOTE - company team invites
  companyTeam: boolean
  // NOTE - max company members; null = n/a
  companyMemberLimit: number | null
  // NOTE - CSV export
  csvExport: boolean
  // NOTE - audit CSV export
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

export type PlanFeature
  = | 'sharedSpaces'
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
