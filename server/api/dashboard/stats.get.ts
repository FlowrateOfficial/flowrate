import { getDashboardStats } from '../../lib/services/dashboard.service'
import { requireSpaceContext } from '../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  return getDashboardStats(ctx)
})
