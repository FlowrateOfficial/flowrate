import { z } from 'zod'
import { createChildAccount } from '../../../../lib/services/members.service'

const bodySchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['CHILD', 'TEEN']),
  dateOfBirth: z.string().datetime().optional()
})

export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const { user, space, membership } = await requireSpaceAccess(event, { spaceId })

  if (!canManageMembers(membership.role, space.type)) {
    throw createError({ statusCode: 403, message: 'Only guardians can create child accounts' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  const result = await createChildAccount(
    user.id,
    spaceId,
    space.type,
    body,
    event
  )

  return {
    member: result.member,
    created: true
  }
})
