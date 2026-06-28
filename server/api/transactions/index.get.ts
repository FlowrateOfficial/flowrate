import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  category: z.string().optional(),
  search: z.string().optional(),
  accountId: z.string().optional(),
  visibility: z.enum(['all', 'shared', 'personal', 'mine']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
})

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)
  const query = await getValidatedQuery(event, querySchema.parse)

  const { page, limit, category, search, accountId, visibility, dateFrom, dateTo } = query
  const skip = (page - 1) * limit

  const accountFilter = accountVisibilityFilter(user.id, membership.role)
  const visibleAccounts = await prisma.account.findMany({
    where: { spaceId: space.id, ...accountFilter },
    select: { id: true }
  })
  const visibleAccountIds = visibleAccounts.map(a => a.id)

  const where = {
    spaceId: space.id,
    accountId: { in: visibleAccountIds },
    ...(category ? { category: category as never } : {}),
    ...(accountId ? { accountId } : {}),
    ...(visibility === 'mine' ? { userId: user.id } : {}),
    ...(dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {})
          }
        }
      : {}),
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: 'insensitive' as const } },
            { merchant: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {})
  }

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        account: { select: { id: true, name: true, visibility: true } },
        user: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit
    }),
    prisma.transaction.count({ where })
  ])

  return {
    items: items.map(tx => ({
      id: tx.id,
      description: tx.description,
      merchant: tx.merchant,
      amount: Number(tx.amount),
      currency: tx.currency,
      category: tx.category,
      date: tx.date.toISOString(),
      pending: tx.pending,
      isMine: tx.userId === user.id,
      ownerName: tx.user.name,
      account: tx.account
    })),
    total,
    page,
    pages: Math.ceil(total / limit)
  }
})
