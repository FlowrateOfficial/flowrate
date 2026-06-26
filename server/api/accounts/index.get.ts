export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)

  const visibility = getQuery(event).visibility as string | undefined

  let where: Parameters<typeof prisma.account.findMany>[0]['where'] = {
    spaceId: space.id
  }

  if (visibility === 'shared') {
    where = { spaceId: space.id, visibility: 'SHARED' }
  } else if (visibility === 'personal') {
    where = { spaceId: space.id, userId: user.id, visibility: 'PERSONAL' }
  } else if (visibility === 'mine') {
    where = { spaceId: space.id, userId: user.id }
  } else if (isChildRole(membership.role)) {
    where = { spaceId: space.id, visibility: 'SHARED' }
  } else {
    where = {
      spaceId: space.id,
      OR: [
        { visibility: 'SHARED' },
        { userId: user.id, visibility: 'PERSONAL' }
      ]
    }
  }

  const accounts = await prisma.account.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true, email: true } } }
  })

  return accounts.map(acc => ({
    id: acc.id,
    name: acc.name,
    institution: acc.institution,
    type: acc.type,
    visibility: acc.visibility,
    balance: Number(acc.balance),
    currency: acc.currency,
    lastSynced: acc.lastSynced?.toISOString() ?? null,
    isMine: acc.userId === user.id,
    ownerName: acc.user.name ?? acc.user.email
  }))
})
