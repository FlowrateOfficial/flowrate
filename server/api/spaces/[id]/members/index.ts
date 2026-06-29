import { z } from 'zod'
import {
  inviteCompanyMember,
  inviteFamilyMember
} from '../../../../lib/services/members.service'
import {
  assertCompanyMemberCapacity,
  assertCompanyTeamInvite,
  userPlanForId
} from '../../../../lib/billing/enforcement'

const familyInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['CO_GUARDIAN', 'TEEN', 'CHILD', 'FINANCE_ADMIN', 'MANAGER', 'MEMBER', 'GUEST']),
  name: z.string().min(1).optional(),
  birthday: z.string().datetime().optional()
})

const companyInviteSchema = z.object({
  phone: z.string().min(8).max(20),
  email: z.string().email().optional(),
  role: z.enum(['FINANCE_ADMIN', 'GUEST']),
  name: z.string().min(1).optional()
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
    const config = useRuntimeConfig(event)
    const appUrl = config.public.appUrl as string

    if (space.type === 'COMPANY') {
      const plan = await userPlanForId(user.id)
      await assertCompanyTeamInvite(user.id, plan)
      await assertCompanyMemberCapacity(spaceId, plan)
      const body = await readValidatedBody(event, companyInviteSchema.parse)
      return inviteCompanyMember(user.id, spaceId, space.name, space.type, body, appUrl)
    }

    const body = await readValidatedBody(event, familyInviteSchema.parse)

    if (body.role === 'CHILD' || body.role === 'TEEN') {
      throw createError({
        statusCode: 400,
        message: 'Use the create-child endpoint to provision child or teen login accounts'
      })
    }

    if (body.role !== 'CO_GUARDIAN') {
      throw createError({ statusCode: 400, message: 'Invalid role for this space' })
    }

    return inviteFamilyMember(user.id, spaceId, space.type, {
      email: body.email,
      role: 'CO_GUARDIAN',
      name: body.name
    }, appUrl)
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
