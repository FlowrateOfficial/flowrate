import { normalizeFxCurrency, type FxCurrency } from '#shared/fx'
import { fetchStripeFxQuotes } from './stripe-quotes'

const CACHE_MS = 6 * 60 * 60 * 1000

export interface FxRateSnapshot {
  base: FxCurrency
  rates: Record<FxCurrency, number>
  /** Stripe checkout-style rates (exchange_rate, includes FX fee). */
  presentmentRates?: Record<FxCurrency, number>
  quoteId?: string
  lockExpiresAt?: number
  fetchedAt: number
  source: 'stripe'
}

const cache = new Map<string, FxRateSnapshot>()

function isCacheFresh(snapshot: FxRateSnapshot, now = Date.now()): boolean {
  if (snapshot.lockExpiresAt) {
    return now < snapshot.lockExpiresAt - 30_000
  }
  return now - snapshot.fetchedAt < CACHE_MS
}

export function resetFxRatesCacheForTests(): void {
  cache.clear()
}

export async function getFxRates(baseCurrency = 'USD', force = false): Promise<FxRateSnapshot> {
  const base = normalizeFxCurrency(baseCurrency)
  const cached = cache.get(base)

  if (!force && cached && isCacheFresh(cached)) {
    return cached
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    if (cached) return cached
    throw createError({ statusCode: 503, message: 'FX rates unavailable' })
  }

  try {
    const snapshot = await fetchStripeFxQuotes(stripeKey, base)
    cache.set(base, snapshot)
    return snapshot
  } catch (error) {
    console.warn(`[fx] Stripe FX Quotes unavailable for ${base}:`, error)
    if (cached) return cached
    throw createError({ statusCode: 502, message: 'Failed to fetch exchange rates' })
  }
}
