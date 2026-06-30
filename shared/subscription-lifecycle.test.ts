import { describe, expect, it } from 'vitest'
import {
  cancellationAfterDays,
  daysSinceExpectedCharge,
  missedRenewalAfterDays,
  resolveStaleSubscription
} from './subscription-lifecycle'
import { ENUM } from './prisma-enums'

describe('subscription lifecycle', () => {
  it('flags missed renewal after grace', () => {
    const next = new Date('2026-01-01')
    const now = next.getTime() + missedRenewalAfterDays(ENUM.period.MONTHLY) * 86_400_000
    const result = resolveStaleSubscription(ENUM.period.MONTHLY, next, now)
    expect(result.action).toBe('missed_renewal')
  })

  it('flags likely cancellation after two billing periods', () => {
    const next = new Date('2026-01-01')
    const now = next.getTime() + cancellationAfterDays(ENUM.period.MONTHLY) * 86_400_000
    const result = resolveStaleSubscription(ENUM.period.MONTHLY, next, now)
    expect(result.action).toBe('likely_cancelled')
    if (result.action === 'likely_cancelled') {
      expect(result.status).toBe(ENUM.subscription.CANCELLED)
    }
  })

  it('computes days since expected charge', () => {
    const next = new Date('2026-06-01')
    const now = new Date('2026-06-11').getTime()
    expect(daysSinceExpectedCharge(next, now)).toBe(10)
  })
})
