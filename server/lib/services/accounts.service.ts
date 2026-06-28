import type { SpaceContext } from '../domain/context'
import {
  accountWhereForSpace,
  listAccounts,
  type AccountListFilter
} from '../repositories/account.repository'

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
    lastSynced: acc.lastSynced?.toISOString() ?? null,
    isMine: acc.userId === viewerId,
    ownerName: acc.user.name ?? acc.user.email
  }
}

export async function getAccountsForSpace(ctx: SpaceContext, filter: AccountListFilter = 'all') {
  const rows = await listAccounts(ctx, filter)
  return rows.map(row => mapAccountDto(row, ctx.userId))
}

export { accountWhereForSpace, type AccountListFilter }
