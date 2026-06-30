// ANCHOR: User preferences + space subscription cap
import type { UserPreferences } from '#shared/user-preferences'
import { mergeUserPreferences, parseUserPreferences } from '#shared/user-preferences'
import type { SpaceSettings } from '#shared/space-settings'
import { mergeSpaceSettings, parseSpaceSettings } from '#shared/space-settings'
import type { SpaceContext } from '../domain/context'

export async function getUserPreferences(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { prefs: true }
  })
  return parseUserPreferences(user?.prefs)
}

export async function patchUserPreferences(userId: string, patch: UserPreferences) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { prefs: true }
  })
  const merged = mergeUserPreferences(user?.prefs, patch)
  await prisma.user.update({
    where: { id: userId },
    data: { prefs: merged as object }
  })
  return merged
}

export async function getSpaceSettings(spaceId: string) {
  const space = await prisma.financialSpace.findUnique({
    where: { id: spaceId },
    select: { settings: true }
  })
  return parseSpaceSettings(space?.settings)
}

export async function patchSpaceSettings(ctx: SpaceContext, patch: SpaceSettings) {
  const space = await prisma.financialSpace.findUnique({
    where: { id: ctx.spaceId },
    select: { settings: true, ownerId: true }
  })
  if (!space) throw createError({ statusCode: 404, message: 'Space not found' })
  if (space.ownerId !== ctx.userId) {
    throw createError({ statusCode: 403, message: 'Only the space owner can update settings' })
  }

  const merged = mergeSpaceSettings(space.settings, patch)
  await prisma.financialSpace.update({
    where: { id: ctx.spaceId },
    data: { settings: merged as object }
  })
  return merged
}
