import { describe, expect, it } from 'vitest'
import { convertWithPresentmentMarkup, convertWithRates, roundMoney, sumWithRates } from './fx'

const eurTable = {
  base: 'EUR' as const,
  rates: { USD: 1.1, GBP: 0.85, EUR: 1 }
}

const usdTable = {
  base: 'USD' as const,
  rates: { USD: 1, EUR: 0.91, GBP: 0.77 }
}

describe('convertWithRates', () => {
  it('returns the same amount for identical currencies', () => {
    expect(convertWithRates(120, 'EUR', 'EUR', eurTable)).toBe(120)
  })

  it('converts EUR to USD with EUR base', () => {
    expect(convertWithRates(100, 'EUR', 'USD', eurTable)).toBe(110)
  })

  it('converts USD to GBP through EUR base', () => {
    const gbp = convertWithRates(110, 'USD', 'GBP', eurTable)
    expect(gbp).toBe(roundMoney((110 / 1.1) * 0.85))
  })

  it('converts EUR to USD with USD base', () => {
    expect(convertWithRates(91, 'EUR', 'USD', usdTable)).toBe(100)
  })

  it('converts GBP to EUR with USD base', () => {
    const eur = convertWithRates(77, 'GBP', 'EUR', usdTable)
    expect(eur).toBe(roundMoney((77 / 0.77) * 0.91))
  })
})

describe('convertWithPresentmentMarkup', () => {
  it('uses Stripe presentment rates when available', () => {
    const gbp = convertWithPresentmentMarkup(12, 'EUR', 'GBP', {
      base: 'EUR',
      rates: { EUR: 1, USD: 1.1, GBP: 0.85 },
      presentmentRates: { EUR: 1, USD: 1.08, GBP: 0.86215 }
    })
    expect(gbp).toBe(10.35)
  })

  it('adds fallback markup when presentment rates are missing', () => {
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
    ], 'EUR', eurTable)
    expect(total).toBe(200)
  })
})
