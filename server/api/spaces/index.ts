import { z } from 'zod'
import { secureAppCookieOptions } from '../../lib/security/cookies'
import { assertCanCreateSpace } from '../../lib/billing/enforcement'

const createSpaceSchema = z.object({
  name: z.string().min(2).max(80),
  type: z.enum(['HOUSEHOLD', 'FAMILY', 'COMPANY'])
})

export default defineEventHandler(async (event) => {
  const user = await requireNeonAuth(event)

  if (event.method === 'GET') {
    const memberships = await prisma.spaceMember.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
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
      where: { id: user.id },
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
        isOwner: m.space.ownerId === user.id
      }))
    }
  }

  if (event.method === 'POST') {
    const body = await readValidatedBody(event, createSpaceSchema.parse)

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
    const plan = (dbUser?.plan ?? 'FREE') as import('#shared/billing').AppPlan

    await assertCanCreateSpace(user.id, body.type, plan)

    const space = await prisma.financialSpace.create({
      data: {
        name: body.name,
        type: body.type,
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

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
