import { getDashboardOverview } from '../../lib/services/dashboard-overview.service'
import { requireSpaceContext } from '../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  return getDashboardOverview(ctx, event)
})
