import { getAdminUsageReport } from '../../lib/billing/usage-report'
import { requireAdmin } from '../../lib/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return getAdminUsageReport()
})
