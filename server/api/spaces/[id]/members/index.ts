import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['CO_GUARDIAN', 'TEEN', 'CHILD', 'FINANCE_ADMIN', 'MANAGER', 'MEMBER', 'GUEST']),
  displayName: z.string().min(1).optional(),
  dateOfBirth: z.string().datetime().optional()
})

export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const { user, space, membership } = await requireSpaceAccess(event, { spaceId })

  if (!canManageMembers(membership.role, space.type)) {
    throw createError({ statusCode: 403, message: 'Only guardians or admins can manage members' })
  }

  if (event.method === 'GET') {
    const members = await prisma.spaceMember.findMany({
      where: { spaceId },
      include: { user: { select: { id: true, name: true, email: true } }, childProfile: true },
      orderBy: { createdAt: 'asc' }
    })
    return members
  }

  if (event.method === 'POST') {
    const body = await readValidatedBody(event, inviteSchema.parse)
    const email = body.email.toLowerCase()

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      const member = await prisma.spaceMember.upsert({
        where: { spaceId_userId: { spaceId, userId: existingUser.id } },
        create: {
          spaceId,
          userId: existingUser.id,
          email,
          role: body.role,
          status: 'ACTIVE',
          displayName: body.displayName ?? existingUser.name,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          invitedBy: user.id,
          joinedAt: new Date()
        },
        update: {
          role: body.role,
          status: 'ACTIVE',
          displayName: body.displayName ?? existingUser.name
        }
      })

      if (body.role === 'CHILD' || body.role === 'TEEN') {
        await prisma.childProfile.upsert({
          where: { memberId: member.id },
          create: { spaceId, memberId: member.id },
          update: {}
        })
      }

      return { member, invited: false }
    }

    const invitation = await prisma.spaceInvitation.create({
      data: {
        spaceId,
        email,
        role: body.role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    const member = await prisma.spaceMember.create({
      data: {
        spaceId,
        email,
        role: body.role,
        status: 'PENDING',
        displayName: body.displayName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        invitedBy: user.id
      }
    })

    if (body.role === 'CHILD' || body.role === 'TEEN') {
      await prisma.childProfile.create({
        data: { spaceId, memberId: member.id }
      })
    }

    const config = useRuntimeConfig(event)
    return {
      member,
      invited: true,
      inviteUrl: `${config.public.appUrl}/auth/register?invite=${invitation.token}`,
      token: invitation.token
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
