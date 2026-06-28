export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)
  const spaceId = getRouterParam(event, 'id')!

  if (space.id !== spaceId) {
    throw createError({ statusCode: 400, message: 'Space mismatch' })
  }

  if (event.method === 'GET') {
    const members = await prisma.spaceMember.findMany({
      where: { spaceId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        childProfile: { include: { jars: true } }
      },
      orderBy: { createdAt: 'asc' }
    })

    const accounts = await prisma.account.findMany({
      where: { spaceId, ...accountVisibilityFilter(user.id, membership.role) },
      select: { id: true, name: true, balance: true, visibility: true, userId: true, type: true }
    })

    return {
      id: space.id,
      name: space.name,
      type: space.type,
      role: membership.role,
      settings: space.settings,
      members: await Promise.all(members.map(async (m) => {
        const base = {
          id: m.id,
          userId: m.userId,
          email: m.user?.email ?? m.email,
          name: m.user?.name ?? m.displayName,
          role: m.role,
          status: m.status,
          dateOfBirth: m.dateOfBirth?.toISOString() ?? null,
          childProfile: m.childProfile
            ? {
                id: m.childProfile.id,
                allowanceAmount: m.childProfile.allowanceAmount ? Number(m.childProfile.allowanceAmount) : null,
                allowanceFrequency: m.childProfile.allowanceFrequency,
                learnMode: m.childProfile.learnMode,
                jars: m.childProfile.jars.map(j => ({
                  id: j.id,
                  name: j.name,
                  balance: Number(j.balance),
                  targetAmount: j.targetAmount ? Number(j.targetAmount) : null
                }))
              }
            : null,
          financialSummary: null as { balance: number, spending30d: number, accountCount: number } | null
        }

        if ((m.role === 'CHILD' || m.role === 'TEEN') && m.userId) {
          const since = new Date()
          since.setDate(since.getDate() - 30)
          const [accounts, recentTxs] = await Promise.all([
            prisma.account.findMany({
              where: { spaceId, userId: m.userId },
              select: { balance: true }
            }),
            prisma.transaction.findMany({
              where: { spaceId, userId: m.userId, date: { gte: since }, amount: { lt: 0 } },
              select: { amount: true }
            })
          ])
          base.financialSummary = {
            balance: accounts.reduce((s, a) => s + Number(a.balance), 0),
            spending30d: recentTxs.reduce((s, t) => s + Math.abs(Number(t.amount)), 0),
            accountCount: accounts.length
          }
        }

        return base
      })),
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
