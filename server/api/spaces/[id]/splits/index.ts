import { z } from 'zod'

const splitRuleSchema = z.object({
  name: z.string().min(1),
  category: z.enum([
    'HOUSING', 'FOOD', 'TRANSPORT', 'SUBSCRIPTIONS', 'UTILITIES', 'HEALTHCARE',
    'ENTERTAINMENT', 'EDUCATION', 'SHOPPING', 'SAVINGS', 'INCOME', 'CLOUD_INFRA',
    'DEVELOPER_TOOLS', 'OTHER'
  ]).optional(),
  mode: z.enum(['EQUAL', 'PROPORTIONAL', 'CUSTOM']),
  splits: z.record(z.string(), z.number()).default({})
})

export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const { space, membership } = await requireSpaceAccess(event, { spaceId })

  if (space.type === 'INDEPENDENT') {
    throw createError({ statusCode: 400, message: 'Split rules require a shared space' })
  }

  if (!canManageMembers(membership.role, space.type)) {
    throw createError({ statusCode: 403, message: 'Insufficient permissions' })
  }

  if (event.method === 'GET') {
    return prisma.splitRule.findMany({ where: { spaceId }, orderBy: { createdAt: 'asc' } })
  }

  if (event.method === 'POST') {
    const body = await readValidatedBody(event, splitRuleSchema.parse)
    return prisma.splitRule.create({
      data: {
        spaceId,
        name: body.name,
        category: body.category,
        mode: body.mode,
        splits: body.splits
      }
    })
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
