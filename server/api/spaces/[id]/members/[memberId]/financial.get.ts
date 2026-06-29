export default defineEventHandler(async (event) => {
  const spaceId = getRouterParam(event, 'id')!
  const memberId = getRouterParam(event, 'memberId')!
  const { space, membership } = await requireSpaceAccess(event, { spaceId })

  if (!canManageMembers(membership.role, space.type)) {
    throw createError({ statusCode: 403, message: 'Only guardians can view member finances' })
  }

  const member = await prisma.spaceMember.findFirst({
    where: { id: memberId, spaceId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      childProfile: { include: { jars: true } }
    }
  })

  if (!member) {
    throw createError({ statusCode: 404, message: 'Member not found' })
  }

  if (!member.userId) {
    return {
      member: {
        id: member.id,
        name: member.name ?? member.email,
        role: member.role,
        status: member.status,
        hasAccount: false
      },
      accounts: [],
      transactions: [],
      stats: { balance: 0, spending30d: 0, income30d: 0, transactionCount: 0 }
    }
  }

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [accounts, transactions, spendingAgg, incomeAgg, txCount30d] = await Promise.all([
    prisma.account.findMany({
      where: { spaceId, userId: member.userId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        institution: true,
        type: true,
        visibility: true,
        balance: true,
        currency: true,
        syncedAt: true
      }
    }),
    prisma.transaction.findMany({
      where: { spaceId, userId: member.userId },
      orderBy: { date: 'desc' },
      take: 30,
      include: { account: { select: { id: true, name: true } } }
    }),
    prisma.transaction.aggregate({
      where: { spaceId, userId: member.userId, date: { gte: since }, amount: { lt: 0 } },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: { spaceId, userId: member.userId, date: { gte: since }, amount: { gt: 0 } },
      _sum: { amount: true }
    }),
    prisma.transaction.count({
      where: { spaceId, userId: member.userId, date: { gte: since } }
    })
  ])

  const income30d = Number(incomeAgg._sum.amount ?? 0)
  const spending30d = Math.abs(Number(spendingAgg._sum.amount ?? 0))
  const balance = accounts.reduce((s, a) => s + Number(a.balance), 0)

  return {
    member: {
      id: member.id,
      userId: member.userId,
      name: member.user?.name ?? member.name ?? member.email,
      email: member.user?.email ?? member.email,
      role: member.role,
      status: member.status,
      birthday: member.birthday?.toISOString() ?? null,
      hasAccount: true,
      childProfile: member.childProfile
        ? {
            allowance: member.childProfile.allowance ? Number(member.childProfile.allowance) : null,
            frequency: member.childProfile.frequency,
            learnMode: member.childProfile.learnMode,
            jars: member.childProfile.jars.map(j => ({
              id: j.id,
              name: j.name,
              balance: Number(j.balance),
              target: j.target ? Number(j.target) : null
            }))
          }
        : null
    },
    accounts: accounts.map(a => ({
      id: a.id,
      name: a.name,
      institution: a.institution,
      type: a.type,
      visibility: a.visibility,
      balance: Number(a.balance),
      currency: a.currency,
      syncedAt: a.syncedAt?.toISOString() ?? null
    })),
    transactions: transactions.map(tx => ({
      id: tx.id,
      description: tx.description,
      merchant: tx.merchant,
      amount: Number(tx.amount),
      currency: tx.currency,
      category: tx.category,
      date: tx.date.toISOString(),
      pending: tx.pending,
      account: tx.account
    })),
    stats: {
      balance: Math.round(balance * 100) / 100,
      spending30d: Math.round(spending30d * 100) / 100,
      income30d: Math.round(income30d * 100) / 100,
      transactionCount: txCount30d
    }
  }
})
