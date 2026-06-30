import { describe, expect, it } from 'vitest'
import { accountWhereForSpace } from './account.repository'
import type { SpaceContext } from '../domain/context'

function ctx(partial: Partial<SpaceContext> & Pick<SpaceContext, 'userId' | 'spaceId' | 'role' | 'spaceType'>): SpaceContext {
  return {
    userEmail: 'user@example.com',
    userName: 'User',
    space: { id: partial.spaceId } as SpaceContext['space'],
    membership: {} as SpaceContext['membership'],
    ...partial
  }
}

describe('accountWhereForSpace', () => {
  it('shows all accounts in company spaces', () => {
    const where = accountWhereForSpace(ctx({
      userId: 'u1',
      spaceId: 's1',
      role: 'GUEST',
      spaceType: 'COMPANY'
    }))

    expect(where).toEqual({ spaceId: 's1' })
  })

  it('restricts child members to shared accounts', () => {
    const where = accountWhereForSpace(ctx({
      userId: 'u1',
      spaceId: 's1',
      role: 'CHILD',
      spaceType: 'FAMILY'
    }))

    expect(where).toMatchObject({ visibility: 'SHARED' })
  })

  it('scopes personal filter to viewer accounts', () => {
    const where = accountWhereForSpace(ctx({
      userId: 'u1',
      spaceId: 's1',
      role: 'OWNER',
      spaceType: 'FAMILY'
    }), 'personal')

    expect(where).toMatchObject({
      userId: 'u1',
      visibility: 'PERSONAL'
    })
  })

  it('scopes mine filter to viewer regardless of visibility', () => {
    const where = accountWhereForSpace(ctx({
      userId: 'u1',
      spaceId: 's1',
      role: 'OWNER',
      spaceType: 'HOUSEHOLD'
    }), 'mine')

    expect(where).toMatchObject({ userId: 'u1' })
  })
})
