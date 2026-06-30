import { describe, expect, it } from 'vitest'
import { findStripePlanInCurrency, matchStripePlan } from './billing-plans'

const plans = [
  { key: 'pro', interval: 'month' as const, currency: 'EUR', priceId: 'eur-month' },
  { key: 'pro', interval: 'month' as const, currency: 'USD', priceId: 'usd-month' },
  { key: 'pro', interval: 'year' as const, currency: 'USD', priceId: 'usd-year' }
]

describe('matchStripePlan', () => {
  it('prefers the requested billing currency', () => {
    expect(matchStripePlan(plans, { planKey: 'pro', interval: 'month', currency: 'USD' })?.priceId)
      .toBe('usd-month')
  })

  it('falls back to EUR when the currency price is missing', () => {
    expect(matchStripePlan(plans, { planKey: 'pro', interval: 'month', currency: 'GBP' })?.priceId)
      .toBe('eur-month')
  })
})

describe('findStripePlanInCurrency', () => {
  it('returns undefined when only another currency exists', () => {
    expect(findStripePlanInCurrency(plans, { planKey: 'pro', interval: 'month', currency: 'GBP' }))
      .toBeUndefined()
  })

  it('returns the exact currency match', () => {
    expect(findStripePlanInCurrency(plans, { planKey: 'pro', interval: 'month', currency: 'USD' })?.priceId)
      .toBe('usd-month')
  })
})
