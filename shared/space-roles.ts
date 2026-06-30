// ANCHOR: Space role/type helpers — shared by client and server

export type SpaceType = 'INDEPENDENT' | 'HOUSEHOLD' | 'FAMILY' | 'COMPANY'

export type SpaceRole =
  | 'OWNER'
  | 'CO_GUARDIAN'
  | 'TEEN'
  | 'CHILD'
  | 'FINANCE_ADMIN'
  | 'MANAGER'
  | 'MEMBER'
  | 'GUEST'

export const MINOR_SPACE_ROLES = ['TEEN', 'CHILD'] as const satisfies readonly SpaceRole[]

export const GUARDIAN_SPACE_ROLES = ['OWNER', 'CO_GUARDIAN'] as const satisfies readonly SpaceRole[]

export const COMPANY_ADMIN_ROLES = ['OWNER', 'FINANCE_ADMIN'] as const satisfies readonly SpaceRole[]

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
  if (spaceType === 'COMPANY') return isCompanyAdminRole(role)
  if (spaceType === 'INDEPENDENT') return role === 'OWNER'
  return isGuardianRole(role)
}

export function rolesForSpaceType(type: SpaceType): SpaceRole[] {
  switch (type) {
    case 'INDEPENDENT':
      return ['OWNER']
    case 'HOUSEHOLD':
      return ['OWNER', 'CO_GUARDIAN']
    case 'FAMILY':
      return ['OWNER', 'CO_GUARDIAN', 'TEEN', 'CHILD']
    case 'COMPANY':
      return ['OWNER', 'FINANCE_ADMIN', 'MANAGER', 'MEMBER', 'GUEST']
  }
}
