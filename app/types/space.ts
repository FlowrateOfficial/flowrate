// ANCHOR: Space types — UI icons; role helpers from shared
import {
  canManageSpace,
  isGuardianRole,
  isMinorRole,
  type SpaceRole,
  type SpaceType
} from '#shared/space-roles'

export type { SpaceRole, SpaceType } from '#shared/space-roles'

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

/** @deprecated Prefer useAppI18n().spaceType() for display labels */
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

export const isTeenOrChild = isMinorRole
export const isGuardian = isGuardianRole
export { canManageSpace }
