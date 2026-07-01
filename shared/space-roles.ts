// ANCHOR: Space role/type helpers — shared by client and server
import type { SpaceRole, SpaceType } from './prisma-enums'
import { ENUM } from './prisma-enums'

export type { SpaceType, SpaceRole }

export const MINOR_SPACE_ROLES = [
  ENUM.role.TEEN,
  ENUM.role.CHILD
] as const satisfies readonly SpaceRole[]

export const GUARDIAN_SPACE_ROLES = [
  ENUM.role.OWNER,
  ENUM.role.CO_GUARDIAN
] as const satisfies readonly SpaceRole[]

export const COMPANY_ADMIN_ROLES = [
  ENUM.role.OWNER,
  ENUM.role.FINANCE_ADMIN
] as const satisfies readonly SpaceRole[]

export const SHARED_SPACE_TYPES = [
  ENUM.space.HOUSEHOLD,
  ENUM.space.FAMILY,
  ENUM.space.COMPANY
] as const satisfies readonly SpaceType[]

export function isMinorRole(role: string): boolean {
  return (MINOR_SPACE_ROLES as readonly string[]).includes(role)
}

export function isGuardianRole(role: string): boolean {
  return (GUARDIAN_SPACE_ROLES as readonly string[]).includes(role)
}

export function isCompanyAdminRole(role: string): boolean {
  return (COMPANY_ADMIN_ROLES as readonly string[]).includes(role)
}

export function canManageSpace(role: string, spaceType: string): boolean {
  if (spaceType === ENUM.space.COMPANY) return isCompanyAdminRole(role)
  if (spaceType === ENUM.space.INDEPENDENT) return role === ENUM.role.OWNER
  return isGuardianRole(role)
}

export function rolesForSpaceType(type: SpaceType): SpaceRole[] {
  switch (type) {
    case ENUM.space.INDEPENDENT:
      return [ENUM.role.OWNER]
    case ENUM.space.HOUSEHOLD:
      return [ENUM.role.OWNER, ENUM.role.CO_GUARDIAN]
    case ENUM.space.FAMILY:
      return [
        ENUM.role.OWNER,
        ENUM.role.CO_GUARDIAN,
        ENUM.role.TEEN,
        ENUM.role.CHILD
      ]
    case ENUM.space.COMPANY:
      return [
        ENUM.role.OWNER,
        ENUM.role.FINANCE_ADMIN,
        ENUM.role.MANAGER,
        ENUM.role.MEMBER,
        ENUM.role.GUEST
      ]
  }
}
