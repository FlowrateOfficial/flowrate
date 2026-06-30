// ANCHOR: Subscription price-change detection (shared server + tests)
import type { BudgetPeriod } from './prisma-enums'
import { ENUM } from './prisma-enums'

export const PRICE_CHANGE_THRESHOLD = 0.01

export type PriceChangeDirection = 'up' | 'down' | 'same'

export interface PriceChange {
  direction: PriceChangeDirection
  delta: number
  percent: number
  prev: number
  newAmount: number
}

export function compareSubscriptionPrice(
  prev: number,
  newAmount: number,
  threshold = PRICE_CHANGE_THRESHOLD
): PriceChange {
  const delta = newAmount - prev
  let direction: PriceChangeDirection = 'same'
  if (delta > threshold) direction = 'up'
  else if (delta < -threshold) direction = 'down'

  const percent = prev > 0
    ? Math.round((delta / prev) * 1000) / 10
    : 0

  return { direction, delta, percent, prev, newAmount }
}

export function isSubscriptionPriceIncrease(
  prev: number,
  newAmount: number,
  threshold = PRICE_CHANGE_THRESHOLD
): boolean {
  return compareSubscriptionPrice(prev, newAmount, threshold).direction === 'up'
}

/** Grace days after expected charge before flagging a missed renewal */
export function missedRenewalGraceDays(frequency: BudgetPeriod | string): number {
  switch (frequency) {
    case ENUM.period.WEEKLY: return 3
    case ENUM.period.YEARLY: return 14
    case ENUM.period.MONTHLY:
    default: return 7
  }
}

/** Monthly billing equivalent for a subscription amount */
export function subscriptionMonthlyEquivalent(amount: number, frequency: BudgetPeriod | string): number {
  switch (frequency) {
    case ENUM.period.WEEKLY: return Math.round((amount * 52) / 12 * 100) / 100
    case ENUM.period.YEARLY: return Math.round((amount / 12) * 100) / 100
    case ENUM.period.MONTHLY:
    default: return amount
  }
}

/** Annualized price increase from a detected hike */
export function annualPriceImpact(
  amount: number,
  prev: number | null,
  frequency: BudgetPeriod | string
): number | null {
  if (prev == null) return null
  const { delta, direction } = compareSubscriptionPrice(prev, amount)
  if (direction !== 'up') return null

  switch (frequency) {
    case ENUM.period.WEEKLY: return Math.round(delta * 52 * 100) / 100
    case ENUM.period.MONTHLY: return Math.round(delta * 12 * 100) / 100
    case ENUM.period.YEARLY: return Math.round(delta * 100) / 100
    default: return null
  }
}

/** Per-period price increase (e.g. +$3/mo) */
export function periodPriceImpact(
  amount: number,
  prev: number | null
): number | null {
  if (prev == null) return null
  const { delta, direction } = compareSubscriptionPrice(prev, amount)
  return direction === 'up' ? Math.round(delta * 100) / 100 : null
}
