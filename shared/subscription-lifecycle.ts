// ANCHOR: Subscription lifecycle — missed renewal, cancellation, resume
import type { BudgetPeriod } from './prisma-enums'
import { ENUM } from './prisma-enums'
import { missedRenewalGraceDays } from './subscription-alerts'

const MS_PER_DAY = 86_400_000

export type SubscriptionLifecycleEvent
  = | 'missed_renewal'
    | 'likely_cancelled'
    | 'resumed'
    | 'price_increase'
    | 'price_decrease'
    | 'new'

export function periodDays(frequency: BudgetPeriod | string): number {
  switch (frequency) {
    case ENUM.period.WEEKLY: return 7
    case ENUM.period.YEARLY: return 365
    case ENUM.period.MONTHLY:
    default: return 30
  }
}

/** Days without a charge before we flag a missed renewal */
export function missedRenewalAfterDays(frequency: BudgetPeriod | string): number {
  return periodDays(frequency) + missedRenewalGraceDays(frequency)
}

/** Days without a charge before we treat the sub as cancelled */
export function cancellationAfterDays(frequency: BudgetPeriod | string): number {
  return periodDays(frequency) * 2 + missedRenewalGraceDays(frequency)
}

export function daysSinceExpectedCharge(nextCharge: Date, now = Date.now()): number {
  return Math.max(0, Math.floor((now - nextCharge.getTime()) / MS_PER_DAY))
}

export type StaleSubscriptionResolution
  = | { action: 'none' }
    | { action: 'missed_renewal', status: typeof ENUM.subscription.PAUSED, alert: true }
    | { action: 'likely_cancelled', status: typeof ENUM.subscription.CANCELLED, alert: true }

export function resolveStaleSubscription(
  frequency: BudgetPeriod | string,
  nextCharge: Date,
  now = Date.now()
): StaleSubscriptionResolution {
  const overdueDays = daysSinceExpectedCharge(nextCharge, now)
  if (overdueDays < missedRenewalGraceDays(frequency)) {
    return { action: 'none' }
  }
  if (overdueDays >= cancellationAfterDays(frequency)) {
    return { action: 'likely_cancelled', status: ENUM.subscription.CANCELLED, alert: true }
  }
  return { action: 'missed_renewal', status: ENUM.subscription.PAUSED, alert: true }
}

export function wasInactiveStatus(status: string) {
  return status === ENUM.subscription.PAUSED || status === ENUM.subscription.CANCELLED
}
