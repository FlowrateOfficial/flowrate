import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(1),
  category: z.string(),
  amount: z.number().positive(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  isShared: z.boolean().default(false)
})

export default defineEventHandler(async (event) => {
  const { user, space } = await requireSpaceAccess(event)
  const body = await readValidatedBody(event, bodySchema.parse)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const result = await prisma.transaction.aggregate({
    where: {
      spaceId: space.id,
      category: body.category as never,
      date: { gte: startOfMonth },
      amount: { lt: 0 }
    },
    _sum: { amount: true }
  })

  const budget = await prisma.budget.create({
    data: {
      userId: user.id,
      spaceId: space.id,
      name: body.name,
      category: body.category as never,
      amount: body.amount,
      period: body.period,
      isShared: body.isShared,
      startDate: startOfMonth
    }
  })

  return {
    id: budget.id,
    name: budget.name,
    category: budget.category,
    amount: Number(budget.amount),
    currency: 'USD',
    spent: Math.abs(Number(result._sum.amount ?? 0)),
    period: budget.period,
    isShared: budget.isShared
  }
})
