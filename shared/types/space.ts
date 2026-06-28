export type SpaceType = 'INDEPENDENT' | 'HOUSEHOLD' | 'FAMILY' | 'COMPANY'
export type SpaceRole = 'OWNER' | 'CO_GUARDIAN' | 'TEEN' | 'CHILD' | 'FINANCE_ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST'
export type AccountVisibility = 'PERSONAL' | 'SHARED'

const MINOR_ROLES: SpaceRole[] = ['TEEN', 'CHILD']

export function isMinorRole(role: SpaceRole): boolean {
  return MINOR_ROLES.includes(role)
}

export interface ActiveSpace {
  id: string
  name: string
  type: SpaceType
  role: SpaceRole
}

export interface FinancialSpaceSummary extends ActiveSpace {
  memberCount?: number
}
