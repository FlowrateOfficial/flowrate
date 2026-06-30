import { describe, expect, it } from 'vitest'
import {
  canManageSpace,
  isCompanyAdminRole,
  isGuardianRole,
  isMinorRole,
  rolesForSpaceType
} from '#shared/space-roles'

describe('space-roles', () => {
  it('identifies minor roles', () => {
    expect(isMinorRole('TEEN')).toBe(true)
    expect(isMinorRole('CHILD')).toBe(true)
    expect(isMinorRole('OWNER')).toBe(false)
  })

  it('identifies guardian roles', () => {
    expect(isGuardianRole('OWNER')).toBe(true)
    expect(isGuardianRole('CO_GUARDIAN')).toBe(true)
    expect(isGuardianRole('GUEST')).toBe(false)
  })

  it('identifies company admins', () => {
    expect(isCompanyAdminRole('OWNER')).toBe(true)
    expect(isCompanyAdminRole('FINANCE_ADMIN')).toBe(true)
    expect(isCompanyAdminRole('MANAGER')).toBe(false)
  })

  it('scopes manage permissions by space type', () => {
    expect(canManageSpace('OWNER', 'INDEPENDENT')).toBe(true)
    expect(canManageSpace('CO_GUARDIAN', 'FAMILY')).toBe(true)
    expect(canManageSpace('FINANCE_ADMIN', 'COMPANY')).toBe(true)
    expect(canManageSpace('GUEST', 'COMPANY')).toBe(false)
    expect(canManageSpace('TEEN', 'FAMILY')).toBe(false)
  })

  it('lists roles per space type', () => {
    expect(rolesForSpaceType('COMPANY')).toContain('GUEST')
    expect(rolesForSpaceType('FAMILY')).toContain('TEEN')
    expect(rolesForSpaceType('INDEPENDENT')).toEqual(['OWNER'])
  })
})
