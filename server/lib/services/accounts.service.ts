import type { H3Event } from 'h3'
import type { SpaceContext } from '../domain/context'
import {
  accountWhereForSpace,
  deleteAccountCascade,
  findAccountInSpace,
  listAccounts,
  type AccountListFilter
} from '../repositories/account.repository'
import { listVisibleAccountIdsForContext } from '../repositories/transaction.repository'
import { assertAccountOwner } from '../domain/space-guard'
import { requirePlaid } from '../plaid'
import { requireStripe } from '../stripe'

export function mapAccountDto(
  acc: Awaited<ReturnType<typeof listAccounts>>[number],
  viewerId: string
) {
  return {
    id: acc.id,
    name: acc.name,
    institution: acc.institution,
    type: acc.type,
    visibility: acc.visibility,
    balance: Number(acc.balance),
    currency: acc.currency,
    syncedAt: acc.syncedAt?.toISOString() ?? null,
    isMine: acc.userId === viewerId,
    ownerName: acc.user.name
  }
}

export async function getAccountsForSpace(ctx: SpaceContext, filter: AccountListFilter = 'all') {
  const rows = await listAccounts(ctx, filter)
  return rows.map(row => mapAccountDto(row, ctx.userId))
}

export async function disconnectAccount(ctx: SpaceContext, accountId: string, event: H3Event) {
  const visibleAccountIds = await listVisibleAccountIdsForContext(ctx)
  if (!visibleAccountIds.includes(accountId)) {
    throw createError({ statusCode: 404, message: 'Account not found' })
  }

  const account = await findAccountInSpace(accountId, ctx.spaceId)
  if (!account) {
    throw createError({ statusCode: 404, message: 'Account not found' })
  }

  assertAccountOwner(ctx.userId, account.userId)

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

  await deleteAccountCascade(account.id)
  return { ok: true }
}

export { accountWhereForSpace, type AccountListFilter }
