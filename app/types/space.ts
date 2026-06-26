export type SpaceType = 'INDEPENDENT' | 'HOUSEHOLD' | 'FAMILY' | 'COMPANY'
export type SpaceRole = 'OWNER' | 'CO_GUARDIAN' | 'TEEN' | 'CHILD' | 'FINANCE_ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST'

export interface FinancialSpaceSummary {
  id: string
  name: string
  type: SpaceType
  role: SpaceRole
  memberCount: number
  accountCount?: number
  isOwner?: boolean
}

export interface ActiveSpace extends FinancialSpaceSummary {
  name: string
}

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  INDEPENDENT: 'Independent',
  HOUSEHOLD: 'Household',
  FAMILY: 'Family',
  COMPANY: 'Company'
}

export const SPACE_TYPE_ICONS: Record<SpaceType, string> = {
  INDEPENDENT: 'i-lucide-user',
  HOUSEHOLD: 'i-lucide-heart-handshake',
  FAMILY: 'i-lucide-users',
  COMPANY: 'i-lucide-building-2'
}

export function isTeenOrChild(role: SpaceRole): boolean {
  return role === 'TEEN' || role === 'CHILD'
}

export function isGuardian(role: SpaceRole): boolean {
  return role === 'OWNER' || role === 'CO_GUARDIAN'
}

export function canManageSpace(role: SpaceRole, type: SpaceType): boolean {
  if (type === 'COMPANY') return role === 'OWNER' || role === 'FINANCE_ADMIN'
  if (type === 'INDEPENDENT') return role === 'OWNER'
  return role === 'OWNER' || role === 'CO_GUARDIAN'
}
