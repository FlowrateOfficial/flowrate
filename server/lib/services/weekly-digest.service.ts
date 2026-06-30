// ANCHOR: Weekly digest email batch
import { planHasFeature } from '#shared/plan-limits'
import { parseUserPreferences } from '#shared/user-preferences'
import { sendWeeklyDigestEmail } from '../email/product-emails'
import { spendingIncomeInRange } from '../repositories/transaction.repository'
import { createFxConverter } from '../fx/converter'

export async function sendWeeklyDigests(appUrl: string) {
  const users = await prisma.user.findMany({
    where: { spaceId: { not: null } },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      prefs: true,
      spaceId: true
    }
  })

  let sent = 0
  for (const user of users) {
    const prefs = parseUserPreferences(user.prefs)
    if (prefs.weeklyDigest === false) continue
    if (!user.spaceId || !planHasFeature(user.plan, 'saasShield')) continue

    const since = new Date()
    since.setDate(since.getDate() - 7)
    const [range, alertCount] = await Promise.all([
      spendingIncomeInRange(user.spaceId, since),
      prisma.detectedSubscription.count({
        where: { spaceId: user.spaceId, alert: true, hidden: false, excluded: false }
      })
    ])

    const fx = await createFxConverter('USD')
    const spending = fx.sum(range.spendingByCurrency.map(row => ({
      amount: row.amount,
      currency: row.currency
    })))
    const income = fx.sum(range.incomeByCurrency.map(row => ({
      amount: row.amount,
      currency: row.currency
    })))

    const ok = await sendWeeklyDigestEmail(null, {
      to: user.email,
      name: user.name ?? '',
      spending,
      income,
      netSavings: income - spending,
      alertCount,
      currency: 'USD',
      appUrl
    })
    if (ok) sent++
  }

  return { sent, candidates: users.length }
}
