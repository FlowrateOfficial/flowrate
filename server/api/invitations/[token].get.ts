export default defineEventHandler(async (event) => {
  const token = getQuery(event).token as string
  if (!token) {
    throw createError({ statusCode: 400, message: 'Invite token required' })
  }

  const invitation = await prisma.spaceInvitation.findUnique({
    where: { token },
    include: { space: { select: { id: true, name: true, type: true } } }
  })

  if (!invitation || invitation.expiresAt < new Date()) {
    throw createError({ statusCode: 404, message: 'Invitation expired or not found' })
  }

  return {
    spaceName: invitation.space.name,
    spaceType: invitation.space.type,
    role: invitation.role,
    email: invitation.email
  }
})
