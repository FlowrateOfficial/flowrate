// ANCHOR: Space detail service — family/company member views
import type { SpaceDetailDto, SpaceDetailMemberDto } from '#shared/api/family'
import type {
  ActiveSpaceResponseDto,
  UserSpacesResponseDto
} from '#shared/api/spaces'
import type { AppPlan } from '#shared/billing'
import type { H3Event } from 'h3'
import type { SpaceContext } from '../domain/context'
import { assertCanCreateSpace } from '../billing/enforcement'
import { secureAppCookieOptions } from '../security/cookies'
import { accountVisibilityFilter, ACTIVE_SPACE_COOKIE, getUserMembership } from '../../utils/spaceAuth'
import {
  findMembersForFamilyView,
  findMembersForTeamView,
  findSpaceAccountsSummary,
  summarizeChildFinances,
  type SpaceDetailView
} from '../repositories/space.repository'

function parseSpaceDetailView(raw: string | undefined): SpaceDetailView {
  const view = String(raw ?? '').toLowerCase()
  if (view === 'team' || view === 'guardians' || view === 'children') return view
  return ''
}

function mapTeamMember(member: Awaited<ReturnType<typeof findMembersForTeamView>>[number]): SpaceDetailMemberDto {
  return {
    id: member.id,
    userId: member.userId,
    email: member.user?.email ?? member.email,
    name: member.user?.name ?? member.name,
    role: member.role,
    status: member.status,
    birthday: null,
    childProfile: null,
    financialSummary: null
  }
}

export async function getSpaceTeamDetail(
  ctx: SpaceContext,
  view: 'team' | 'guardians'
): Promise<SpaceDetailDto> {
  const members = await findMembersForTeamView(ctx.spaceId, view)

  return {
    id: ctx.space.id,
    name: ctx.space.name,
    type: ctx.space.type,
    role: ctx.role,
    settings: ctx.space.settings,
    members: members.map(mapTeamMember),
    accounts: []
  }
}

export async function getSpaceFamilyDetail(
  ctx: SpaceContext,
  view: SpaceDetailView
): Promise<SpaceDetailDto> {
  const members = await findMembersForFamilyView(ctx.spaceId, view)

  const accounts = view === 'children'
    ? []
    : await findSpaceAccountsSummary(
        ctx.spaceId,
        accountVisibilityFilter(ctx.userId, ctx.role)
      )

  const childMembers = members.filter(
    member => (member.role === 'CHILD' || member.role === 'TEEN') && member.userId
  )
  const childUserIds = childMembers.map(member => member.userId!)

  const childSummaries = view === 'guardians'
    ? new Map()
    : await summarizeChildFinances(ctx.spaceId, childUserIds)

  return {
    id: ctx.space.id,
    name: ctx.space.name,
    type: ctx.space.type,
    role: ctx.role,
    settings: ctx.space.settings,
    members: members.map((member) => {
      const childProfile = member.childProfile
        ? {
            id: member.childProfile.id,
            allowance: member.childProfile.allowance ? Number(member.childProfile.allowance) : null,
            frequency: member.childProfile.frequency,
            learnMode: member.childProfile.learnMode,
            jars: member.childProfile.jars.map(jar => ({
              id: jar.id,
              name: jar.name,
              balance: Number(jar.balance),
              target: jar.target ? Number(jar.target) : null
            }))
          }
        : null

      return {
        id: member.id,
        userId: member.userId,
        email: member.user?.email ?? member.email,
        name: member.user?.name ?? member.name,
        role: member.role,
        status: member.status,
        birthday: member.birthday?.toISOString() ?? null,
        childProfile,
        financialSummary: member.userId ? childSummaries.get(member.userId) ?? null : null
      }
    }),
    accounts: accounts.map(account => ({
      id: account.id,
      name: account.name,
      balance: Number(account.balance),
      visibility: account.visibility,
      isMine: account.userId === ctx.userId,
      type: account.type
    }))
  }
}

export async function getSpaceDetail(
  ctx: SpaceContext,
  rawView?: string
): Promise<SpaceDetailDto> {
  const view = parseSpaceDetailView(rawView)

  if (view === 'team' || view === 'guardians') {
    return getSpaceTeamDetail(ctx, view)
  }

  return getSpaceFamilyDetail(ctx, view)
}

// NOTE - List spaces the user belongs to
export async function listUserSpaces(userId: string): Promise<UserSpacesResponseDto> {
  const memberships = await prisma.spaceMember.findMany({
    where: { userId, status: 'ACTIVE' },
    include: {
      space: {
        include: {
          _count: { select: { members: true, accounts: true } }
        }
      }
    },
    orderBy: { joinedAt: 'asc' }
  })

  const userRow = await prisma.user.findUnique({
    where: { id: userId },
    select: { spaceId: true }
  })

  const minorMembership = memberships.find(m => m.role === 'TEEN' || m.role === 'CHILD')
  const visible = minorMembership
    ? memberships.filter(m => m.spaceId === minorMembership.spaceId)
    : memberships

  const spaceId = minorMembership?.spaceId
    ?? (userRow?.spaceId && visible.some(m => m.space.id === userRow.spaceId)
      ? userRow.spaceId
      : visible[0]?.space.id ?? null)

  return {
    spaceId,
    spaces: visible.map(m => ({
      id: m.space.id,
      name: m.space.name,
      type: m.space.type,
      role: m.role,
      memberCount: m.space._count.members,
      accountCount: m.space._count.accounts,
      isOwner: m.space.ownerId === userId
    }))
  }
}

export async function createUserSpace(
  event: H3Event,
  user: { id: string, name: string | null },
  input: { name: string, type: 'HOUSEHOLD' | 'FAMILY' | 'COMPANY' }
) {
  const isMinor = await prisma.spaceMember.findFirst({
    where: { userId: user.id, status: 'ACTIVE', role: { in: ['TEEN', 'CHILD'] } }
  })
  if (isMinor) {
    throw createError({ statusCode: 403, message: 'Child and teen accounts cannot create spaces' })
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true }
  })
  const plan = (dbUser?.plan ?? 'FREE') as AppPlan

  await assertCanCreateSpace(user.id, input.type, plan)

  const space = await prisma.financialSpace.create({
    data: {
      name: input.name,
      type: input.type,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
          status: 'ACTIVE',
          name: user.name,
          joinedAt: new Date()
        }
      }
    },
    include: { _count: { select: { members: true } } }
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { spaceId: space.id }
  })

  setCookie(event, ACTIVE_SPACE_COOKIE, space.id, {
    ...secureAppCookieOptions(event),
    maxAge: 60 * 60 * 24 * 365
  })

  return {
    id: space.id,
    name: space.name,
    type: space.type,
    role: 'OWNER' as const,
    memberCount: space._count.members
  }
}

export async function switchActiveSpace(
  event: H3Event,
  userId: string,
  spaceId: string
): Promise<ActiveSpaceResponseDto> {
  const membership = await getUserMembership(userId, spaceId)
  if (!membership) {
    throw createError({ statusCode: 403, message: 'You do not have access to this space' })
  }

  const minorMembership = await prisma.spaceMember.findFirst({
    where: { userId, status: 'ACTIVE', role: { in: ['TEEN', 'CHILD'] } }
  })
  if (minorMembership && spaceId !== minorMembership.spaceId) {
    throw createError({ statusCode: 403, message: 'Child and teen accounts cannot switch spaces' })
  }

  await prisma.user.update({
    where: { id: userId },
    data: { spaceId }
  })

  setCookie(event, ACTIVE_SPACE_COOKIE, spaceId, {
    ...secureAppCookieOptions(event),
    maxAge: 60 * 60 * 24 * 365
  })

  return {
    id: spaceId,
    name: membership.space.name,
    type: membership.space.type,
    role: membership.role,
    memberCount: 1
  }
}
