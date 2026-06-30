import { describe, expect, it } from 'vitest'
import { convertWithPresentmentMarkup, convertWithRates, roundMoney, sumWithRates } from './fx'

const table = {
  base: 'EUR' as const,
  rates: { USD: 1.1, GBP: 0.85, EUR: 1 }
}

describe('convertWithRates', () => {
  it('returns the same amount for identical currencies', () => {
    expect(convertWithRates(120, 'EUR', 'EUR', table)).toBe(120)
  })

  it('converts EUR to USD', () => {
    expect(convertWithRates(100, 'EUR', 'USD', table)).toBe(110)
  })

  it('converts USD to GBP through EUR', () => {
    const gbp = convertWithRates(110, 'USD', 'GBP', table)
    expect(gbp).toBe(roundMoney((110 / 1.1) * 0.85))
  })
})

describe('convertWithPresentmentMarkup', () => {
  it('adds Stripe checkout markup on cross-currency conversion', () => {
    const gbp = convertWithPresentmentMarkup(12, 'EUR', 'GBP', {
      base: 'EUR',
      rates: { EUR: 1, USD: 1.1, GBP: 0.86215 }
    })
    expect(gbp).toBe(10.75)
  })
})

describe('sumWithRates', () => {
  it('sums mixed currency rows into the target currency', () => {
    const total = sumWithRates([
      { amount: 100, currency: 'EUR' },
      { amount: 110, currency: 'USD' }
    ], 'EUR', table)
    expect(total).toBe(200)
  })
})
