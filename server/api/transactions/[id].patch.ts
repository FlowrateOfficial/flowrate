import { z } from 'zod'

const patchSchema = z.object({
  category: z.enum([
    'HOUSING', 'FOOD', 'TRANSPORT', 'SUBSCRIPTIONS', 'UTILITIES', 'HEALTHCARE',
    'ENTERTAINMENT', 'EDUCATION', 'SHOPPING', 'SAVINGS', 'INCOME', 'CLOUD_INFRA',
    'DEVELOPER_TOOLS', 'OTHER'
  ]).optional(),
  description: z.string().min(1).max(500).optional()
})

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, patchSchema.parse)

  const accountFilter = accountVisibilityFilter(user.id, membership.role)
  const visibleAccountIds = (await prisma.account.findMany({
    where: { spaceId: space.id, ...accountFilter },
    select: { id: true }
  })).map(a => a.id)

  const tx = await prisma.transaction.findFirst({
    where: { id, spaceId: space.id, accountId: { in: visibleAccountIds } }
  })

  if (!tx) {
    throw createError({ statusCode: 404, message: 'Transaction not found' })
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: body,
    include: { account: { select: { id: true, name: true } } }
  })

  return {
    id: updated.id,
    description: updated.description,
    merchant: updated.merchant,
    amount: Number(updated.amount),
    currency: updated.currency,
    category: updated.category,
    date: updated.date.toISOString(),
    pending: updated.pending,
    account: updated.account
  }
})
