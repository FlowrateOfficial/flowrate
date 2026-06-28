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
    where: { childProfileId: profile.id },
    orderBy: { createdAt: 'asc' }
  })

  const totalSaved = jars.reduce((sum, j) => sum + Number(j.balance), 0)

  return {
    displayName: membership.displayName ?? user.name,
    role: membership.role,
    learnMode: profile.learnMode,
    allowanceAmount: profile.allowanceAmount ? Number(profile.allowanceAmount) : null,
    allowanceFrequency: profile.allowanceFrequency,
    spendingLimits: profile.spendingLimits,
    jars: jars.map(j => ({
      id: j.id,
      name: j.name,
      balance: Number(j.balance),
      targetAmount: j.targetAmount ? Number(j.targetAmount) : null,
      progress: j.targetAmount ? Math.min(100, (Number(j.balance) / Number(j.targetAmount)) * 100) : null
    })),
    totalSaved
  }
})
