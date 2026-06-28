import { requireStripe } from '../../lib/stripe'

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)
  const id = getRouterParam(event, 'id')!

  const accountFilter = accountVisibilityFilter(user.id, membership.role)
  const visibleAccountIds = (await prisma.account.findMany({
    where: { spaceId: space.id, ...accountFilter },
    select: { id: true }
  })).map(a => a.id)

  if (!visibleAccountIds.includes(id)) {
    throw createError({ statusCode: 404, message: 'Account not found' })
  }

  const account = await prisma.account.findFirst({
    where: { id, spaceId: space.id }
  })

  if (!account) {
    throw createError({ statusCode: 404, message: 'Account not found' })
  }

  if (account.userId !== user.id) {
    throw createError({ statusCode: 403, message: 'Only the account owner can disconnect' })
  }

  if (account.stripeFcAccountId) {
    try {
      const { stripe } = requireStripe(event)
      await stripe.financialConnections.accounts.disconnect(account.stripeFcAccountId)
    } catch {
      // NOTE - Stripe may already be disconnected
    }
  }

  await prisma.transaction.deleteMany({ where: { accountId: account.id } })
  await prisma.account.delete({ where: { id: account.id } })

  return { ok: true }
})
