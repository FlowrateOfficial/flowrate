export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event, { withChildProfile: true })

  if (!isChildRole(membership.role)) {
    throw createError({ statusCode: 403, message: 'Teen dashboard only' })
  }

  const profile = membership.childProfile
  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  const jars = await prisma.allowanceJar.findMany({
    where: { childId: profile.id },
    orderBy: { createdAt: 'asc' }
  })

  const totalSaved = jars.reduce((sum, j) => sum + Number(j.balance), 0)

  return {
    name: membership.name ?? user.name,
    role: membership.role,
    learnMode: profile.learnMode,
    allowance: profile.allowance ? Number(profile.allowance) : null,
    frequency: profile.frequency,
    limits: profile.limits,
    jars: jars.map(j => ({
      id: j.id,
      name: j.name,
      balance: Number(j.balance),
      target: j.target ? Number(j.target) : null,
      progress: j.target ? Math.min(100, (Number(j.balance) / Number(j.target)) * 100) : null
    })),
    totalSaved
  }
})
