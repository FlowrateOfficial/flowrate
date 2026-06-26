import type { SpaceRole, SpaceType, MemberStatus } from '~/generated/prisma'

export const ACTIVE_SPACE_COOKIE = 'flowrate-active-space'

const GUARDIAN_ROLES: SpaceRole[] = ['OWNER', 'CO_GUARDIAN']
const COMPANY_ADMIN_ROLES: SpaceRole[] = ['OWNER', 'FINANCE_ADMIN']
const CHILD_ROLES: SpaceRole[] = ['CHILD', 'TEEN']

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  INDEPENDENT: 'Independent',
  HOUSEHOLD: 'Household',
  FAMILY: 'Family',
  COMPANY: 'Company'
}

export function isGuardianRole(role: SpaceRole): boolean {
  return GUARDIAN_ROLES.includes(role)
}

export function isCompanyAdminRole(role: SpaceRole): boolean {
  return COMPANY_ADMIN_ROLES.includes(role)
}

export function isChildRole(role: SpaceRole): boolean {
  return CHILD_ROLES.includes(role)
}

export function canManageMembers(role: SpaceRole, spaceType: SpaceType): boolean {
  if (spaceType === 'COMPANY') return isCompanyAdminRole(role) || role === 'OWNER'
  if (spaceType === 'INDEPENDENT') return role === 'OWNER'
  return role === 'OWNER' || role === 'CO_GUARDIAN'
}

export function canConnectBanks(role: SpaceRole): boolean {
  return ['OWNER', 'CO_GUARDIAN', 'FINANCE_ADMIN', 'MEMBER'].includes(role)
}

export function canViewFinancials(role: SpaceRole): boolean {
  return !isChildRole(role) || role === 'TEEN'
}

export async function ensureDefaultIndependentSpace(userId: string, userName: string | null) {
  const existing = await prisma.spaceMember.findFirst({
    where: { userId, space: { type: 'INDEPENDENT' } },
    include: { space: true }
  })
  if (existing) return existing.space

  const space = await prisma.financialSpace.create({
    data: {
      name: userName ? `${userName}'s Finances` : 'My Finances',
      type: 'INDEPENDENT',
      ownerId: userId,
      members: {
        create: {
          userId,
          role: 'OWNER',
          status: 'ACTIVE',
          displayName: userName,
          joinedAt: new Date()
        }
      }
    }
  })

  await migrateUserDataToSpace(userId, space.id)

  await prisma.user.update({
    where: { id: userId },
    data: { activeSpaceId: space.id }
  })

  return space
}

export async function migrateUserDataToSpace(userId: string, spaceId: string) {
  await prisma.$transaction([
    prisma.account.updateMany({ where: { userId }, data: { spaceId } }),
    prisma.transaction.updateMany({ where: { userId }, data: { spaceId } }),
    prisma.budget.updateMany({ where: { userId }, data: { spaceId } }),
    prisma.detectedSubscription.updateMany({ where: { userId }, data: { spaceId } })
  ])
}

export async function getUserMembership(userId: string, spaceId: string) {
  return prisma.spaceMember.findFirst({
    where: { spaceId, userId, status: 'ACTIVE' },
    include: { space: true, childProfile: { include: { jars: true } } }
  })
}

export async function resolveActiveSpaceId(event: Parameters<typeof getRequestHeaders>[0], userId: string) {
  const cookieSpaceId = getCookie(event, ACTIVE_SPACE_COOKIE)
  if (cookieSpaceId) {
    const membership = await getUserMembership(userId, cookieSpaceId)
    if (membership) return cookieSpaceId
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeSpaceId: true }
  })
  if (user?.activeSpaceId) {
    const membership = await getUserMembership(userId, user.activeSpaceId)
    if (membership) return user.activeSpaceId
  }

  const firstMembership = await prisma.spaceMember.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { joinedAt: 'asc' }
  })
  return firstMembership?.spaceId ?? null
}

export async function requireSpaceAccess(
  event: Parameters<typeof getRequestHeaders>[0],
  options?: { spaceId?: string, minRoles?: SpaceRole[] }
) {
  const user = await requireNeonAuth(event)
  await ensureDefaultIndependentSpace(user.id, user.name ?? null)

  const querySpaceId = getQuery(event).spaceId as string | undefined
  const headerSpaceId = getRequestHeader(event, 'x-flowrate-space') ?? undefined
  const spaceId = options?.spaceId ?? querySpaceId ?? headerSpaceId ?? await resolveActiveSpaceId(event, user.id)

  if (!spaceId) {
    throw createError({ statusCode: 400, message: 'No active financial space' })
  }

  const membership = await getUserMembership(user.id, spaceId)
  if (!membership) {
    throw createError({ statusCode: 403, message: 'You do not have access to this space' })
  }

  if (options?.minRoles?.length && !options.minRoles.includes(membership.role)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' })
  }

  return { user, space: membership.space, membership }
}

export function accountVisibilityFilter(userId: string, role: SpaceRole) {
  if (isChildRole(role)) {
    return { visibility: 'SHARED' as const }
  }
  return {
    OR: [
      { visibility: 'SHARED' as const },
      { userId, visibility: 'PERSONAL' as const }
    ]
  }
}

export function getRolesForSpaceType(type: SpaceType): SpaceRole[] {
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

export async function acceptPendingInvitations(userId: string, email: string) {
  const invitations = await prisma.spaceInvitation.findMany({
    where: { email: email.toLowerCase(), expiresAt: { gt: new Date() } }
  })

  for (const invite of invitations) {
    await prisma.spaceMember.upsert({
      where: {
        spaceId_email: { spaceId: invite.spaceId, email: email.toLowerCase() }
      },
      create: {
        spaceId: invite.spaceId,
        userId,
        email: email.toLowerCase(),
        role: invite.role,
        status: 'ACTIVE' as MemberStatus,
        joinedAt: new Date()
      },
      update: {
        userId,
        status: 'ACTIVE' as MemberStatus,
        joinedAt: new Date()
      }
    })
    await prisma.spaceInvitation.delete({ where: { id: invite.id } })
  }
}
