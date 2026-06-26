import { z } from 'zod'

const childUpdateSchema = z.object({
  allowanceAmount: z.number().min(0).optional(),
  allowanceFrequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  learnMode: z.boolean().optional(),
  spendingLimits: z.record(z.string(), z.number()).optional()
})

const jarSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().min(0).optional()
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
        allowanceAmount: body.allowanceAmount,
        allowanceFrequency: body.allowanceFrequency,
        learnMode: body.learnMode,
        spendingLimits: body.spendingLimits ?? undefined
      },
      include: { jars: true }
    })
  }

  if (event.method === 'POST') {
    const body = await readValidatedBody(event, jarSchema.parse)
    return prisma.allowanceJar.create({
      data: {
        childProfileId: member.childProfile.id,
        name: body.name,
        targetAmount: body.targetAmount,
        balance: 0
      }
    })
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
