import { z } from 'zod'
import { periodStart } from '../../utils/budgetPeriod'
import { localeFromRequest, resolveSpaceDisplayCurrency } from '../../utils/currency'

const bodySchema = z.object({
  name: z.string().min(1),
  category: z.string(),
  amount: z.number().positive(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  isShared: z.boolean().default(false)
})

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)
  const id = getRouterParam(event, 'id')!

  if (!canEditFinancials(membership.role, space.type)) {
    throw createError({ statusCode: 403, message: 'You have read-only access to this business space' })
  }

  const existing = await prisma.budget.findFirst({
    where: { id, spaceId: space.id }
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Budget not found' })
  }

  if (existing.userId !== user.id && !existing.isShared) {
    throw createError({ statusCode: 403, message: 'Cannot edit this budget' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)
  const currency = await resolveSpaceDisplayCurrency(space.id, localeFromRequest(event))
  const now = new Date()
  const from = periodStart(body.period, now)

  const result = await prisma.transaction.aggregate({
    where: {
      spaceId: space.id,
      category: body.category as never,
      date: { gte: from },
      amount: { lt: 0 }
    },
    _sum: { amount: true }
  })

  const budget = await prisma.budget.update({
    where: { id },
    data: {
      name: body.name,
      category: body.category as never,
      amount: body.amount,
      period: body.period,
      isShared: body.isShared
    }
  })

  return {
    id: budget.id,
    name: budget.name,
    category: budget.category,
    amount: Number(budget.amount),
    currency,
    spent: Math.abs(Number(result._sum.amount ?? 0)),
    period: budget.period,
    isShared: budget.isShared,
    isMine: budget.userId === user.id
  }
})
