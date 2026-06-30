// ANCHOR: Detected subscription sync from imported transactions
import { compareSubscriptionPrice, periodPriceImpact } from '#shared/subscription-alerts'
import { resolveStaleSubscription, wasInactiveStatus } from '#shared/subscription-lifecycle'
import { ENUM } from '#shared/prisma-enums'
import { planHasFeature } from '#shared/plan-limits'
import { parseUserPreferences } from '#shared/user-preferences'
import { detectSubscriptionsFromTransactions } from '../utils/subscriptions'
import { merchantDomainForName } from './services/subscriptions.service'
import { deferTask } from './jobs/defer'
import { sendSubscriptionPriceAlertEmail } from './email/product-emails'
import { userPlanForId } from './billing/enforcement'

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

  const detectedNames = new Set(detected.map(sub => sub.name))
  const now = Date.now()

  for (const sub of detected) {
    const existing = await prisma.detectedSubscription.findFirst({
      where: { spaceId, userId, name: sub.name }
    })

    if (existing) {
      const prevAmount = Number(existing.amount)
      const change = compareSubscriptionPrice(prevAmount, sub.amount)
      const priceWentUp = change.direction === 'up'
      const priceWentDown = change.direction === 'down'

      let status = existing.status
      let alert = existing.alert
      let alertDismissedAt = existing.alertDismissedAt
      let prev: number | null = existing.prev != null
        ? Number(existing.prev)
        : null

      if (priceWentUp) {
        status = ENUM.subscription.PRICE_CHANGED
        alert = true
        alertDismissedAt = null
        prev = prevAmount
        queuePriceAlertEmail(userId, sub.name, sub.amount, prevAmount, existing.currency)
      } else if (priceWentDown) {
        status = ENUM.subscription.ACTIVE
        alert = true
        alertDismissedAt = null
        prev = prevAmount
      } else if (wasInactiveStatus(existing.status)) {
        status = ENUM.subscription.ACTIVE
        alert = true
        alertDismissedAt = null
        prev = null
      }

      await prisma.detectedSubscription.update({
        where: { id: existing.id },
        data: {
          amount: sub.amount,
          frequency: sub.frequency,
          category: sub.category,
          lastCharge: sub.lastCharge,
          nextCharge: sub.nextCharge,
          alert,
          alertDismissedAt,
          status,
          prev,
          merchantDomain: existing.merchantDomain ?? merchantDomainForName(sub.name)
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
          nextCharge: sub.nextCharge,
          merchantDomain: merchantDomainForName(sub.name)
        }
      })
    }
  }

  const stale = await prisma.detectedSubscription.findMany({
    where: {
      spaceId,
      status: { not: ENUM.subscription.CANCELLED },
      nextCharge: { not: null }
    }
  })

  for (const sub of stale) {
    if (detectedNames.has(sub.name)) continue
    if (!sub.nextCharge) continue
    if (sub.excluded) continue

    const resolution = resolveStaleSubscription(sub.frequency, sub.nextCharge, now)
    if (resolution.action === 'none') continue

    if (sub.status === ENUM.subscription.CANCELLED && resolution.action === 'missed_renewal') {
      continue
    }

    const escalateToCancelled = resolution.status === ENUM.subscription.CANCELLED
      && sub.status !== ENUM.subscription.CANCELLED

    await prisma.detectedSubscription.update({
      where: { id: sub.id },
      data: {
        status: resolution.status,
        alert: escalateToCancelled ? true : (resolution.alert || sub.alert),
        alertDismissedAt: escalateToCancelled ? null : sub.alertDismissedAt
      }
    })
  }
}

function queuePriceAlertEmail(
  userId: string,
  subscriptionName: string,
  amount: number,
  prevAmount: number,
  currency: string
) {
  deferTask('subscription-price-email', async () => {
    const [user, plan] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, prefs: true } }),
      userPlanForId(userId)
    ])
    if (!user?.email || !planHasFeature(plan, 'saasShield')) return

    const prefs = parseUserPreferences(user.prefs)
    if (prefs.emailPriceAlerts === false) return

    const config = useRuntimeConfig()
    await sendSubscriptionPriceAlertEmail(null, {
      to: user.email,
      name: user.name ?? '',
      subscriptionName,
      periodImpact: periodPriceImpact(amount, prevAmount) ?? 0,
      annualImpact: null,
      currency,
      appUrl: config.public.appUrl as string
    })
  })
}
