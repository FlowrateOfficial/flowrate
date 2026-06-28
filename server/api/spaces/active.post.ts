import { z } from 'zod'

const activeSpaceSchema = z.object({
  spaceId: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const user = await requireNeonAuth(event)
  const { spaceId } = await readValidatedBody(event, activeSpaceSchema.parse)

  const membership = await getUserMembership(user.id, spaceId)
  if (!membership) {
    throw createError({ statusCode: 403, message: 'You do not have access to this space' })
  }

  const minorMembership = await prisma.spaceMember.findFirst({
    where: { userId: user.id, status: 'ACTIVE', role: { in: ['TEEN', 'CHILD'] } }
  })
  if (minorMembership && spaceId !== minorMembership.spaceId) {
    throw createError({ statusCode: 403, message: 'Child and teen accounts cannot switch spaces' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { activeSpaceId: spaceId }
  })

  setCookie(event, ACTIVE_SPACE_COOKIE, spaceId, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  })

  return { id: spaceId, name: membership.space.name, type: membership.space.type, role: membership.role, memberCount: 1 }
})
