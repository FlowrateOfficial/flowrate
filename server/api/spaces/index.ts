import { z } from 'zod'

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

    return memberships.map(m => ({
      id: m.space.id,
      name: m.space.name,
      type: m.space.type,
      role: m.role,
      memberCount: m.space._count.members,
      accountCount: m.space._count.accounts,
      isOwner: m.space.ownerId === user.id
    }))
  }

  if (event.method === 'POST') {
    const body = await readValidatedBody(event, createSpaceSchema.parse)

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
            displayName: user.name,
            joinedAt: new Date()
          }
        }
      },
      include: { _count: { select: { members: true } } }
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { activeSpaceId: space.id }
    })

    setCookie(event, ACTIVE_SPACE_COOKIE, space.id, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
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
