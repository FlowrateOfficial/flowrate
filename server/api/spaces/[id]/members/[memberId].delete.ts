export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const memberId = getRouterParam(event, 'memberId')!
  const { user, space, membership } = await requireSpaceAccess(event, { spaceId })

  if (!canManageMembers(membership.role, space.type)) {
    throw createError({ statusCode: 403, message: 'Only guardians or admins can manage members' })
  }

  const target = await prisma.spaceMember.findFirst({
    where: { id: memberId, spaceId }
  })

  if (!target) {
    throw createError({ statusCode: 404, message: 'Member not found' })
  }

  if (target.role === 'OWNER') {
    throw createError({ statusCode: 403, message: 'Cannot remove the space owner' })
  }

  if (target.userId === user.id) {
    throw createError({ statusCode: 403, message: 'You cannot remove yourself' })
  }

  if (target.email) {
    await prisma.spaceInvitation.deleteMany({
      where: { spaceId, email: target.email.toLowerCase() }
    })
  }

  await prisma.spaceMember.delete({ where: { id: memberId } })

  return { ok: true }
})
