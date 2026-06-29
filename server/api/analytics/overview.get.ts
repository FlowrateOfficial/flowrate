import { z } from 'zod'
import type { AnalyticsRange } from '../../utils/analytics'
import { getAnalyticsOverview } from '../../lib/services/analytics.service'
import { localeFromRequest, resolveSpaceDisplayCurrency } from '../../utils/currency'

const querySchema = z.object({
  range: z.enum(['7d', '30d', '90d', '12m']).default('30d')
})

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)
  const { range } = await getValidatedQuery(event, querySchema.parse)

  const accountFilter = accountVisibilityFilter(user.id, membership.role)

  const accounts = await prisma.account.findMany({
    where: { spaceId: space.id, ...accountFilter },
    select: { id: true, balance: true, createdAt: true }
  })

  const currency = await resolveSpaceDisplayCurrency(space.id, localeFromRequest(event))

  return getAnalyticsOverview(
    {
      spaceId: space.id,
      accountIds: accounts.map(a => a.id),
      accounts: accounts.map(a => ({
        balance: Number(a.balance),
        createdAt: a.createdAt
      })),
      currency
    },
    range as AnalyticsRange
  )
})
