import { describe, expect, it } from 'vitest'
import { snapshotFromStripeFxQuote } from './stripe-quotes'

describe('snapshotFromStripeFxQuote', () => {
  it('builds EUR-based tables from Stripe base_rate and exchange_rate', () => {
    const snapshot = snapshotFromStripeFxQuote({
      id: 'fxq_test',
      lock_expires_at: 1_800_000_000,
      to_currency: 'eur',
      rates: {
        usd: {
          exchange_rate: 0.91,
          rate_details: { base_rate: 0.93, fx_fee_rate: 0.02 }
        },
        gbp: {
          exchange_rate: 1.18,
          rate_details: { base_rate: 1.2 }
        }
      }
    }, 'EUR')

    expect(snapshot.base).toBe('EUR')
    expect(snapshot.source).toBe('stripe')
    expect(snapshot.rates.USD).toBeCloseTo(1 / 0.93, 5)
    expect(snapshot.rates.GBP).toBeCloseTo(1 / 1.2, 5)
    expect(snapshot.presentmentRates?.USD).toBeCloseTo(1 / 0.91, 5)
    expect(snapshot.presentmentRates?.GBP).toBeCloseTo(1 / 1.18, 5)
    expect(snapshot.lockExpiresAt).toBe(1_800_000_000_000)
  })

  it('builds USD-based tables when settlement currency is USD', () => {
    const snapshot = snapshotFromStripeFxQuote({
      id: 'fxq_usd',
      to_currency: 'usd',
      rates: {
        eur: {
          exchange_rate: 1.08,
          rate_details: { base_rate: 1.1 }
        },
        gbp: {
          exchange_rate: 0.79,
          rate_details: { base_rate: 0.8 }
        }
      }
    }, 'USD')

    expect(snapshot.base).toBe('USD')
    expect(snapshot.rates.EUR).toBeCloseTo(1 / 1.1, 5)
    expect(snapshot.rates.GBP).toBeCloseTo(1 / 0.8, 5)
    expect(snapshot.rates.USD).toBe(1)
  })
})
