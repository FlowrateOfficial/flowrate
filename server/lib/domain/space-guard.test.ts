import { describe, expect, it } from 'vitest'
import {
  assertAccountOwner,
  assertGuardianCanViewMember,
  assertRouteSpaceId
} from './space-guard'
import type { SpaceContext } from './context'

function ctx(spaceId: string): SpaceContext {
  return {
    userId: 'u1',
    userEmail: 'u@example.com',
    userName: 'User',
    spaceId,
    role: 'OWNER',
    spaceType: 'FAMILY',
    space: { id: spaceId } as SpaceContext['space'],
    membership: {} as SpaceContext['membership']
  }
}

describe('assertRouteSpaceId', () => {
  it('passes when route space matches context', () => {
    expect(() => assertRouteSpaceId(ctx('s1'), 's1')).not.toThrow()
  })

  it('rejects cross-space IDOR attempts', () => {
    expect(() => assertRouteSpaceId(ctx('s1'), 's2')).toThrowError(/Space mismatch/)
  })
})

describe('assertGuardianCanViewMember', () => {
  const canManage = (role: string, _spaceType: string) => role === 'OWNER' || role === 'CO_GUARDIAN'

  it('allows guardians', () => {
    expect(() =>
      assertGuardianCanViewMember('OWNER', 'FAMILY', canManage)
    ).not.toThrow()
  })

  it('blocks teens from member financial drill-down', () => {
    expect(() =>
      assertGuardianCanViewMember('TEEN', 'FAMILY', canManage)
    ).toThrowError(/Only guardians/)
  })
})

describe('assertAccountOwner', () => {
  it('allows the linked account owner', () => {
    expect(() => assertAccountOwner('u1', 'u1')).not.toThrow()
  })

  it('blocks disconnect by another member', () => {
    expect(() => assertAccountOwner('u1', 'u2')).toThrowError(/account owner/)
  })
})
