import { z } from 'zod'

const childUpdateSchema = z.object({
  allowance: z.number().min(0).optional(),
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  learnMode: z.boolean().optional(),
  limits: z.record(z.string(), z.number()).optional()
})

const jarSchema = z.object({
  name: z.string().min(1),
  target: z.number().min(0).optional()
})

export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const memberId = getRouterParam(event, 'memberId')!
  const { membership } = await requireSpaceAccess(event, { spaceId })

  if (!canManageMembers(membership.role, membership.space.type)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' })
  }

  const member = await prisma.spaceMember.findFirst({
    where: { id: memberId, spaceId },
    include: { childProfile: { include: { jars: true } } }
  })
  if (!member?.childProfile) {
    throw createError({ statusCode: 404, message: 'Child profile not found' })
  }

  if (event.method === 'PATCH') {
    const body = await readValidatedBody(event, childUpdateSchema.parse)
    return prisma.childProfile.update({
      where: { id: member.childProfile.id },
      data: {
        allowance: body.allowance,
        frequency: body.frequency,
        learnMode: body.learnMode,
        limits: body.limits ?? undefined
      },
      include: { jars: true }
    })
  }

  if (event.method === 'POST') {
    const body = await readValidatedBody(event, jarSchema.parse)
    return prisma.allowanceJar.create({
      data: {
        childId: member.childProfile.id,
        name: body.name,
        target: body.target,
        balance: 0
      }
    })
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
