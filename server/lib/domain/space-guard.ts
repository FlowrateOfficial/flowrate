// ANCHOR: Route param space ID must match active space context
import { createError } from 'h3'
import type { SpaceRole, SpaceType } from '~~/generated/prisma/client'
import type { SpaceContext } from './context'

export function assertRouteSpaceId(ctx: SpaceContext, routeSpaceId: string) {
  if (ctx.spaceId !== routeSpaceId) {
    throw createError({ statusCode: 400, message: 'Space mismatch' })
  }
}

/** @internal Test helper — mirrors guardian check on member financial */
export function assertGuardianCanViewMember(
  role: string,
  spaceType: string,
  canManage: (role: SpaceRole, spaceType: SpaceType) => boolean
) {
  if (!canManage(role as SpaceRole, spaceType as SpaceType)) {
    throw createError({ statusCode: 403, message: 'Only guardians can view member finances' })
  }
}

/** @internal Test helper — account disconnect owner check */
export function assertAccountOwner(viewerId: string, accountUserId: string) {
  if (accountUserId !== viewerId) {
    throw createError({ statusCode: 403, message: 'Only the account owner can disconnect' })
  }
}
