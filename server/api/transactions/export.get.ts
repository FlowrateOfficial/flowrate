import { userPlanForId, assertAuditExport } from '../../lib/billing/enforcement'
import { planHasFeature } from '#shared/plan-limits'

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)
  const plan = await userPlanForId(user.id)
  const audit = getQuery(event).audit === '1'

  if (!planHasFeature(plan, 'csvExport')) {
    throw createError({ statusCode: 402, message: 'CSV export is not available on your plan' })
  }

  if (audit) {
    await assertAuditExport(user.id, plan)
  }

  const accountFilter = accountVisibilityFilter(user.id, membership.role)
  const visibleAccounts = await prisma.account.findMany({
    where: { spaceId: space.id, ...accountFilter },
    select: { id: true }
  })

  const txs = await prisma.transaction.findMany({
    where: {
      spaceId: space.id,
      accountId: { in: visibleAccounts.map(a => a.id) }
    },
    include: {
      account: { select: { name: true } },
      user: audit ? { select: { id: true, email: true, name: true } } : false
    },
    orderBy: { date: 'desc' },
    take: audit ? 10000 : 5000
  })

  const header = audit
    ? 'Date,Description,Merchant,Category,Account,Amount,Currency,Pending,TransactionId,UserId,UserEmail,ExportedAt\n'
    : 'Date,Description,Merchant,Category,Account,Amount,Currency,Pending\n'

  const exportedAt = new Date().toISOString()
  const rows = txs.map((tx) => {
    const base = [
      tx.date.toISOString().slice(0, 10),
      csvEscape(tx.description),
      csvEscape(tx.merchant ?? ''),
      tx.category,
      csvEscape(tx.account.name),
      Number(tx.amount).toFixed(2),
      tx.currency,
      tx.pending ? 'yes' : 'no'
    ]

    if (audit) {
      base.push(
        tx.id,
        tx.userId,
        csvEscape(tx.user?.email ?? ''),
        exportedAt
      )
    }

    return base.join(',')
  })

  const filename = audit ? 'flowrate-transactions-audit.csv' : 'flowrate-transactions.csv'

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  return header + rows.join('\n')
})

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
