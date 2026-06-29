// ANCHOR: Detected subscription sync from imported transactions
import { detectSubscriptionsFromTransactions } from '../utils/subscriptions'

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
          lastCharge: sub.lastCharge,
          nextCharge: sub.nextCharge,
          alert: priceChanged || existing.alert,
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
          lastCharge: sub.lastCharge,
          nextCharge: sub.nextCharge
        }
      })
    }
  }
}
