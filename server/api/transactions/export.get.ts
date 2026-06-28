export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)

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
    include: { account: { select: { name: true } } },
    orderBy: { date: 'desc' },
    take: 5000
  })

  const header = 'Date,Description,Merchant,Category,Account,Amount,Currency,Pending\n'
  const rows = txs.map(tx => [
    tx.date.toISOString().slice(0, 10),
    csvEscape(tx.description),
    csvEscape(tx.merchant ?? ''),
    tx.category,
    csvEscape(tx.account.name),
    Number(tx.amount).toFixed(2),
    tx.currency,
    tx.pending ? 'yes' : 'no'
  ].join(','))

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'attachment; filename="flowrate-transactions.csv"')

  return header + rows.join('\n')
})

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
