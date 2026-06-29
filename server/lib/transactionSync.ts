// ANCHOR: Stripe FC transaction import
import type Stripe from 'stripe'
import { ensureFinancialConnectionSubscriptions } from './stripe'
import { syncSpaceSubscriptions } from './subscriptionSync'
import { mapStripeFcTransaction } from '../utils/transactions'

export { syncSpaceSubscriptions } from './subscriptionSync'

export async function syncAccountTransactions(
  stripe: Stripe,
  account: {
    id: string
    userId: string
    spaceId: string
    stripeId: string | null
  }
) {
  if (!account.stripeId) return { imported: 0 }

  try {
    await stripe.financialConnections.accounts.refresh(account.stripeId, {
      features: ['balance', 'transactions']
    })
  } catch {
    // NOTE - Refresh may fail in test mode — still attempt listing
  }

  await ensureFinancialConnectionSubscriptions(stripe, account.stripeId)

  let imported = 0
  let startingAfter: string | undefined

  for (let page = 0; page < 5; page++) {
    const batch = await stripe.financialConnections.transactions.list({
      account: account.stripeId,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {})
    })

    for (const tx of batch.data) {
      const description = tx.description ?? 'Bank transaction'
      const mapped = mapStripeFcTransaction(tx, description)

      await prisma.transaction.upsert({
        where: { stripeId: tx.id },
        create: {
          userId: account.userId,
          spaceId: account.spaceId,
          accountId: account.id,
          stripeId: tx.id,
          ...mapped
        },
        update: mapped
      })
      imported++
    }

    if (!batch.has_more || !batch.data.length) break
    startingAfter = batch.data[batch.data.length - 1]?.id
  }

  return { imported }
}

export async function syncSpaceTransactions(stripe: Stripe, spaceId: string, userId: string) {
  const accounts = await prisma.account.findMany({
    where: { spaceId, stripeId: { not: null } }
  })

  let total = 0
  for (const account of accounts) {
    const { imported } = await syncAccountTransactions(stripe, account)
    total += imported
  }

  await syncSpaceSubscriptions(spaceId, userId)
  return { imported: total, accounts: accounts.length }
}
