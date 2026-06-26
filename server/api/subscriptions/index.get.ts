import { z } from 'zod'

const querySchema = z.object({
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
})

export default defineEventHandler(async (event) => {
  const { space } = await requireSpaceAccess(event)
  const { status, limit } = await getValidatedQuery(event, querySchema.parse)

  const subs = await prisma.detectedSubscription.findMany({
    where: {
      spaceId: space.id,
      ...(status ? { status: status as never } : {})
    },
    orderBy: { amount: 'desc' },
    take: limit
  })

  const nameCounts = subs.reduce<Record<string, number>>((acc, s) => {
    const key = s.name.toLowerCase()
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return subs.map(s => ({
    id: s.id,
    name: s.name,
    amount: Number(s.amount),
    currency: s.currency,
    frequency: s.frequency,
    status: s.status,
    icon: s.icon,
    lastCharged: s.lastCharged?.toISOString() ?? null,
    nextCharge: s.nextCharge?.toISOString() ?? null,
    priceAlert: s.priceAlert,
    isDuplicate: (nameCounts[s.name.toLowerCase()] ?? 0) > 1
  }))
})
