import { describe, expect, it } from 'vitest'
import {
  annualPriceImpact,
  compareSubscriptionPrice,
  isSubscriptionPriceIncrease,
  missedRenewalGraceDays,
  periodPriceImpact,
  PRICE_CHANGE_THRESHOLD
} from './subscription-alerts'
import { ENUM } from './prisma-enums'

describe('compareSubscriptionPrice', () => {
  it('detects price increases above threshold', () => {
    const change = compareSubscriptionPrice(9.99, 12.99)
    expect(change.direction).toBe('up')
    expect(change.delta).toBeCloseTo(3, 2)
    expect(change.percent).toBeCloseTo(30, 0)
  })

  it('ignores noise within threshold', () => {
    const change = compareSubscriptionPrice(10, 10 + PRICE_CHANGE_THRESHOLD)
    expect(change.direction).toBe('same')
  })

  it('detects price decreases', () => {
    const change = compareSubscriptionPrice(15, 9.99)
    expect(change.direction).toBe('down')
    expect(change.percent).toBeLessThan(0)
  })

  it('isSubscriptionPriceIncrease is true only for increases', () => {
    expect(isSubscriptionPriceIncrease(10, 11)).toBe(true)
    expect(isSubscriptionPriceIncrease(10, 10.005)).toBe(false)
    expect(isSubscriptionPriceIncrease(10, 9)).toBe(false)
  })
})

describe('annualPriceImpact', () => {
  it('annualizes monthly hikes', () => {
    expect(annualPriceImpact(12.99, 9.99, ENUM.period.MONTHLY)).toBe(36)
  })

  it('returns null when there is no hike', () => {
    expect(annualPriceImpact(10, 10, ENUM.period.MONTHLY)).toBeNull()
  })
})

describe('periodPriceImpact', () => {
  it('returns per-period delta', () => {
    expect(periodPriceImpact(12.99, 9.99)).toBe(3)
  })
})

describe('missedRenewalGraceDays', () => {
  it('uses shorter grace for weekly subs', () => {
    expect(missedRenewalGraceDays(ENUM.period.WEEKLY)).toBeLessThan(
      missedRenewalGraceDays(ENUM.period.MONTHLY)
    )
  })
})
