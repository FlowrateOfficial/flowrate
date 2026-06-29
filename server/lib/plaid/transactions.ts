// ANCHOR: Plaid transaction sync via /transactions/sync
import type { PlaidApi } from 'plaid'
import { mapPlaidTransaction } from './map'
import { syncSpaceSubscriptions } from '../subscriptionSync'

export async function syncPlaidAccountTransactions(
  client: PlaidApi,
  account: {
    id: string
    userId: string
    spaceId: string
    plaidId: string | null
    linkId: string | null
  }
) {
  if (!account.plaidId || !account.linkId) return { imported: 0 }

  const link = await prisma.plaidLink.findUnique({
    where: { id: account.linkId }
  })
  if (!link) return { imported: 0 }

  let cursor = link.syncCursor ?? undefined
  let imported = 0
  let hasMore = true

  while (hasMore) {
    const response = await client.transactionsSync({
      access_token: link.token,
      cursor
    })

    for (const tx of response.data.added) {
      if (tx.account_id !== account.plaidId) continue
      const mapped = mapPlaidTransaction(tx)
      await prisma.transaction.upsert({
        where: { plaidId: tx.transaction_id },
        create: {
          userId: account.userId,
          spaceId: account.spaceId,
          accountId: account.id,
          plaidId: tx.transaction_id,
          ...mapped
        },
        update: mapped
      })
      imported++
    }

    for (const tx of response.data.modified) {
      if (tx.account_id !== account.plaidId) continue
      const mapped = mapPlaidTransaction(tx)
      await prisma.transaction.updateMany({
        where: { plaidId: tx.transaction_id },
        data: mapped
      })
    }

    for (const removed of response.data.removed) {
      await prisma.transaction.deleteMany({
        where: { plaidId: removed.transaction_id }
      })
    }

    cursor = response.data.next_cursor
    hasMore = response.data.has_more
  }

  if (cursor !== undefined) {
    await prisma.plaidLink.update({
      where: { id: link.id },
      data: { syncCursor: cursor }
    })
  }

  return { imported }
}

export async function syncPlaidSpaceTransactions(
  client: PlaidApi,
  spaceId: string,
  userId: string
) {
  const accounts = await prisma.account.findMany({
    where: { spaceId, provider: 'PLAID', plaidId: { not: null } }
  })

  let total = 0
  for (const account of accounts) {
    const { imported } = await syncPlaidAccountTransactions(client, account)
    total += imported
  }

  await syncSpaceSubscriptions(spaceId, userId)
  return { imported: total, accounts: accounts.length }
}

export async function syncPlaidLinkTransactions(
  client: PlaidApi,
  linkId: string
) {
  const link = await prisma.plaidLink.findUnique({ where: { id: linkId } })
  if (!link) return { imported: 0 }

  const accounts = await prisma.account.findMany({
    where: { linkId: link.id, plaidId: { not: null } }
  })

  let total = 0
  for (const account of accounts) {
    const { imported } = await syncPlaidAccountTransactions(client, account)
    total += imported
  }

  await syncSpaceSubscriptions(link.spaceId, link.userId)
  return { imported: total, accounts: accounts.length }
}
