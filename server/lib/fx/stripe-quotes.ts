import { DISPLAY_CURRENCIES } from '#shared/currency'
import { normalizeFxCurrency, type FxCurrency } from '#shared/fx'
import type { FxRateSnapshot } from './rates'

/** Preview API version required for FX Quotes — https://docs.stripe.com/api/fx_quotes */
const STRIPE_FX_API_VERSION = '2025-07-30.preview'

interface StripeFxQuoteRate {
  exchange_rate: number
  rate_details?: {
    base_rate?: number
    fx_fee_rate?: number
    reference_rate?: number
    reference_rate_provider?: string
  }
}

interface StripeFxQuoteResponse {
  id: string
  lock_expires_at?: number
  to_currency: string
  rates: Record<string, StripeFxQuoteRate>
}

/** Stripe: amount_in_to = amount_in_from * rate → store as 1/rate (units of `code` per 1 base). */
function fromStripeRate(stripeRate: number): number {
  return 1 / stripeRate
}

export function snapshotFromStripeFxQuote(
  quote: StripeFxQuoteResponse,
  base: FxCurrency
): FxRateSnapshot {
  const rates = { [base]: 1 } as Record<FxCurrency, number>
  const presentmentRates = { [base]: 1 } as Record<FxCurrency, number>

  for (const code of DISPLAY_CURRENCIES) {
    if (code === base) continue
    const entry = quote.rates[code.toLowerCase()]
    const baseRate = entry?.rate_details?.base_rate
    if (typeof baseRate === 'number' && baseRate > 0) {
      rates[code] = fromStripeRate(baseRate)
    }
    const exchangeRate = entry?.exchange_rate
    if (typeof exchangeRate === 'number' && exchangeRate > 0) {
      presentmentRates[code] = fromStripeRate(exchangeRate)
    }
  }

  return {
    base,
    rates,
    presentmentRates,
    quoteId: quote.id,
    lockExpiresAt: quote.lock_expires_at ? quote.lock_expires_at * 1000 : undefined,
    fetchedAt: Date.now(),
    source: 'stripe'
  }
}

export async function fetchStripeFxQuotes(
  secretKey: string,
  baseCurrency: string
): Promise<FxRateSnapshot> {
  const base = normalizeFxCurrency(baseCurrency)
  const fromCurrencies = DISPLAY_CURRENCIES.filter(code => code !== base)
  const body = new URLSearchParams()
  body.set('to_currency', base.toLowerCase())
  body.set('lock_duration', 'hour')
  for (const code of fromCurrencies) {
    body.append('from_currencies[]', code.toLowerCase())
  }

  const response = await fetch('https://api.stripe.com/v1/fx_quotes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Stripe-Version': STRIPE_FX_API_VERSION,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Stripe FX Quotes failed (${response.status}): ${detail.slice(0, 200)}`)
  }

  const quote = await response.json() as StripeFxQuoteResponse
  return snapshotFromStripeFxQuote(quote, base)
}
