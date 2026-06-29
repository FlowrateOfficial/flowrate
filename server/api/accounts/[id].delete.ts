import { requireStripe } from '../../lib/stripe'
import { requirePlaid } from '../../lib/plaid'

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)

  const accountFilter = accountVisibilityFilter(user.id, membership.role)
  const visibleAccountIds = (await prisma.account.findMany({
    where: { spaceId: space.id, ...accountFilter },
    select: { id: true }
  })).map(a => a.id)

  const id = getRouterParam(event, 'id')!
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

  if (account.stripeId) {
    try {
      const { stripe } = requireStripe(event)
      await stripe.financialConnections.accounts.disconnect(account.stripeId)
    } catch {
      // NOTE - Stripe may already be disconnected
    }
  }

  if (account.plaidId && account.linkId) {
    try {
      const { client } = requirePlaid(event)
      const link = await prisma.plaidLink.findUnique({ where: { id: account.linkId } })
      if (link) {
        const remaining = await prisma.account.count({
          where: { linkId: link.id, id: { not: account.id } }
        })
        if (remaining === 0) {
          try {
            await client.itemRemove({ access_token: link.token })
          } catch {
            // NOTE - Link may already be removed
          }
          await prisma.plaidLink.delete({ where: { id: link.id } })
        }
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode !== 503) {
        throw error
      }
    }
  }

  await prisma.transaction.deleteMany({ where: { accountId: account.id } })
  await prisma.account.delete({ where: { id: account.id } })

  return { ok: true }
})
