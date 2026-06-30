import { userPlanForId, assertAuditExport } from '../../lib/billing/enforcement'
import { planHasFeature } from '#shared/plan-limits'
import { exportTransactionsCsv } from '../../lib/services/transactions.service'
import { requireSpaceContext } from '../../lib/domain/http'

export default defineEventHandler(async (event) => {
  const ctx = await requireSpaceContext(event)
  const plan = await userPlanForId(ctx.userId)
  const audit = getQuery(event).audit === '1'

  if (!planHasFeature(plan, 'csvExport')) {
    throw createError({ statusCode: 402, message: 'CSV export is not available on your plan' })
  }

  if (audit) {
    await assertAuditExport(ctx.userId, plan)
  }

  const { csv, filename } = await exportTransactionsCsv(ctx, audit)

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  return csv
})
