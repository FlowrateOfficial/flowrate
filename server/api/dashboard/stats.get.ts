export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const accountFilter = accountVisibilityFilter(user.id, membership.role)

  const [accounts, currentMonthTx, lastMonthTx, members] = await Promise.all([
    prisma.account.findMany({ where: { spaceId: space.id, ...accountFilter } }),
    prisma.transaction.findMany({
      where: { spaceId: space.id, date: { gte: startOfMonth } }
    }),
    prisma.transaction.findMany({
      where: { spaceId: space.id, date: { gte: startOfLastMonth, lte: endOfLastMonth } }
    }),
    prisma.spaceMember.count({ where: { spaceId: space.id, status: 'ACTIVE' } })
  ])

  function calcStats(txs: typeof currentMonthTx) {
    const spending = txs.filter(t => Number(t.amount) < 0).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
    const income = txs.filter(t => Number(t.amount) > 0).reduce((sum, t) => sum + Number(t.amount), 0)
    return { spending, income, net: income - spending }
  }

  const current = calcStats(currentMonthTx)
  const last = calcStats(lastMonthTx)

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
  const sharedBalance = accounts.filter(a => a.visibility === 'SHARED').reduce((sum, a) => sum + Number(a.balance), 0)
  const personalBalance = accounts.filter(a => a.userId === user.id && a.visibility === 'PERSONAL').reduce((sum, a) => sum + Number(a.balance), 0)

  function pctChange(curr: number, prev: number): string | null {
    if (prev === 0) return null
    const pct = ((curr - prev) / prev) * 100
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
  }

  return {
    spaceType: space.type,
    memberCount: members,
    totalBalance,
    sharedBalance,
    personalBalance,
    balanceChange: pctChange(totalBalance, totalBalance),
    monthlySpending: current.spending,
    spendingChange: pctChange(current.spending, last.spending),
    monthlyIncome: current.income,
    incomeChange: pctChange(current.income, last.income),
    netSavings: current.net,
    savingsChange: pctChange(current.net, last.net)
  }
})
