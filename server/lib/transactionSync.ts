import type Stripe from 'stripe'
import { detectSubscriptionsFromTransactions } from '../utils/subscriptions'
import { mapStripeFcTransaction } from '../utils/transactions'

export async function syncAccountTransactions(
  stripe: Stripe,
  account: {
    id: string
    userId: string
    spaceId: string
    stripeFcAccountId: string | null
  }
) {
  if (!account.stripeFcAccountId) return { imported: 0 }

  try {
    await stripe.financialConnections.accounts.refresh(account.stripeFcAccountId, {
      features: ['transactions', 'balance']
    })
  } catch {
    // Refresh may fail in test mode — still attempt listing
  }

  let imported = 0
  let startingAfter: string | undefined

  for (let page = 0; page < 5; page++) {
    const batch = await stripe.financialConnections.transactions.list({
      account: account.stripeFcAccountId,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {})
    })

    for (const tx of batch.data) {
      const description = tx.description ?? 'Bank transaction'
      const mapped = mapStripeFcTransaction(tx, description)

      await prisma.transaction.upsert({
        where: { stripeTransactionId: tx.id },
        create: {
          userId: account.userId,
          spaceId: account.spaceId,
          accountId: account.id,
          stripeTransactionId: tx.id,
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

export async function syncSpaceSubscriptions(spaceId: string, userId: string) {
  const since = new Date()
  since.setMonth(since.getMonth() - 6)

  const txs = await prisma.transaction.findMany({
    where: { spaceId, date: { gte: since }, amount: { lt: 0 } },
    select: { merchant: true, description: true, amount: true, date: true, category: true }
  })

  const detected = detectSubscriptionsFromTransactions(
    txs.map(tx => ({
      merchant: tx.merchant,
      description: tx.description,
      amount: Number(tx.amount),
      date: tx.date,
      category: tx.category
    }))
  )

  for (const sub of detected) {
    const existing = await prisma.detectedSubscription.findFirst({
      where: { spaceId, userId, name: sub.name }
    })

    if (existing) {
      const priceChanged = Math.abs(Number(existing.amount) - sub.amount) > 0.01
      await prisma.detectedSubscription.update({
        where: { id: existing.id },
        data: {
          amount: sub.amount,
          frequency: sub.frequency,
          category: sub.category,
          lastCharged: sub.lastCharged,
          nextCharge: sub.nextCharge,
          priceAlert: priceChanged || existing.priceAlert,
          status: 'ACTIVE'
        }
      })
    } else {
      await prisma.detectedSubscription.create({
        data: {
          userId,
          spaceId,
          name: sub.name,
          amount: sub.amount,
          frequency: sub.frequency,
          category: sub.category,
          lastCharged: sub.lastCharged,
          nextCharge: sub.nextCharge
        }
      })
    }
  }
}

export async function syncSpaceTransactions(stripe: Stripe, spaceId: string, userId: string) {
  const accounts = await prisma.account.findMany({
    where: { spaceId, stripeFcAccountId: { not: null } }
  })

  let total = 0
  for (const account of accounts) {
    const { imported } = await syncAccountTransactions(stripe, account)
    total += imported
  }

  await syncSpaceSubscriptions(spaceId, userId)
  return { imported: total, accounts: accounts.length }
}
