export default defineEventHandler(async (event) => {
  const { user, space } = await requireSpaceAccess(event)
  const id = getRouterParam(event, 'id')!

  const budget = await prisma.budget.findFirst({
    where: { id, spaceId: space.id }
  })

  if (!budget) {
    throw createError({ statusCode: 404, message: 'Budget not found' })
  }

  if (budget.userId !== user.id && !budget.isShared) {
    throw createError({ statusCode: 403, message: 'Cannot delete this budget' })
  }

  await prisma.budget.delete({ where: { id } })
  return { ok: true }
})
