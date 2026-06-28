import { z } from 'zod'
import { deleteOffspringUserAccount } from '../../../../lib/services/user-deletion.service'

const bodySchema = z.object({
  purge: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const memberId = getRouterParam(event, 'memberId')!
  const body = await readBody(event).catch(() => ({}))
  const parsed = bodySchema.safeParse(body ?? {})
  const purge = parsed.success ? parsed.data.purge : undefined

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
    throw createError({ statusCode: 403, message: 'Use Settings to delete your own account' })
  }

  const shouldPurge = purge === true
    || (isChildRole(target.role) && Boolean(target.userId))

  if (shouldPurge && target.userId && isChildRole(target.role)) {
    return deleteOffspringUserAccount(event, spaceId, memberId)
  }

  if (target.email) {
    await prisma.spaceInvitation.deleteMany({
      where: { spaceId, email: target.email.toLowerCase() }
    })
  }

  await prisma.spaceMember.delete({ where: { id: memberId } })

  return { ok: true, purged: false }
})
