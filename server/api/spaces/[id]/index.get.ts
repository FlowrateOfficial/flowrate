export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)
  const spaceId = getRouterParam(event, 'id')!

  if (space.id !== spaceId) {
    throw createError({ statusCode: 400, message: 'Space mismatch' })
  }

  if (event.method === 'GET') {
    const view = String(getQuery(event).view ?? '').toLowerCase()
    if (view === 'team' || view === 'guardians') {
      const members = await prisma.spaceMember.findMany({
        where: {
          spaceId,
          ...(view === 'guardians' ? { role: { notIn: ['CHILD', 'TEEN'] } } : {})
        },
        select: {
          id: true,
          userId: true,
          email: true,
          name: true,
          role: true,
          status: true,
          user: { select: { email: true, name: true } }
        },
        orderBy: { createdAt: 'asc' }
      })

      return {
        id: space.id,
        name: space.name,
        type: space.type,
        role: membership.role,
        members: members.map(m => ({
          id: m.id,
          userId: m.userId,
          email: m.user?.email ?? m.email,
          name: m.user?.name ?? m.name,
          role: m.role,
          status: m.status
        }))
      }
    }

    const members = await prisma.spaceMember.findMany({
      where: {
        spaceId,
        ...(view === 'children' ? { role: { in: ['CHILD', 'TEEN'] } } : {})
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        childProfile: { include: { jars: true } }
      },
      orderBy: { createdAt: 'asc' }
    })

    const accounts = view === 'children'
      ? []
      : await prisma.account.findMany({
          where: { spaceId, ...accountVisibilityFilter(user.id, membership.role) },
          select: { id: true, name: true, balance: true, visibility: true, userId: true, type: true }
        })

    const childMembers = members.filter(
      m => (m.role === 'CHILD' || m.role === 'TEEN') && m.userId
    )
    const childUserIds = childMembers.map(m => m.userId!)

    const childSummaries = new Map<string, { balance: number, spending30d: number, accountCount: number }>()

    if (childUserIds.length && view !== 'guardians') {
      const since = new Date()
      since.setDate(since.getDate() - 30)

      const [childAccounts, childSpendingTxs] = await Promise.all([
        prisma.account.findMany({
          where: { spaceId, userId: { in: childUserIds } },
          select: { userId: true, balance: true }
        }),
        prisma.transaction.findMany({
          where: {
            spaceId,
            userId: { in: childUserIds },
            date: { gte: since },
            amount: { lt: 0 }
          },
          select: { userId: true, amount: true }
        })
      ])

      for (const userId of childUserIds) {
        const accountsForChild = childAccounts.filter(a => a.userId === userId)
        const spending30d = childSpendingTxs
          .filter(tx => tx.userId === userId)
          .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)

        childSummaries.set(userId, {
          balance: accountsForChild.reduce((sum, a) => sum + Number(a.balance), 0),
          spending30d,
          accountCount: accountsForChild.length
        })
      }
    }

    return {
      id: space.id,
      name: space.name,
      type: space.type,
      role: membership.role,
      settings: space.settings,
      members: members.map((m) => {
        const base = {
          id: m.id,
          userId: m.userId,
          email: m.user?.email ?? m.email,
          name: m.user?.name ?? m.name,
          role: m.role,
          status: m.status,
          birthday: m.birthday?.toISOString() ?? null,
          childProfile: m.childProfile
            ? {
                id: m.childProfile.id,
                allowance: m.childProfile.allowance ? Number(m.childProfile.allowance) : null,
                frequency: m.childProfile.frequency,
                learnMode: m.childProfile.learnMode,
                jars: m.childProfile.jars.map(j => ({
                  id: j.id,
                  name: j.name,
                  balance: Number(j.balance),
                  target: j.target ? Number(j.target) : null
                }))
              }
            : null,
          financialSummary: m.userId ? childSummaries.get(m.userId) ?? null : null
        }

        return base
      }),
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        balance: Number(a.balance),
        visibility: a.visibility,
        isMine: a.userId === user.id,
        type: a.type
      }))
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
