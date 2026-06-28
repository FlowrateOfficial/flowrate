// ANCHOR: Space-scoped request context DTO
import type { FinancialSpace, SpaceMember, SpaceRole, SpaceType } from '~~/generated/prisma'

export interface SpaceContext {
  userId: string
  userEmail: string
  userName: string | null
  spaceId: string
  spaceType: SpaceType
  role: SpaceRole
  space: FinancialSpace
  membership: SpaceMember
}

export function toSpaceContext(
  user: { id: string, email: string, name: string | null },
  space: FinancialSpace,
  membership: SpaceMember
): SpaceContext {
  return {
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    spaceId: space.id,
    spaceType: space.type,
    role: membership.role,
    space,
    membership
  }
}
