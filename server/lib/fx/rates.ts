import { DISPLAY_CURRENCIES } from '#shared/currency'
import { FX_BASE_CURRENCY, type FxCurrency } from '#shared/fx'

const CACHE_MS = 6 * 60 * 60 * 1000
const FRANKFURTER_URL = 'https://api.frankfurter.app/latest'

export interface FxRateSnapshot {
  base: typeof FX_BASE_CURRENCY
  rates: Record<FxCurrency, number>
  fetchedAt: number
}

let cache: FxRateSnapshot | null = null

function buildSnapshot(rates: Record<string, number>): FxRateSnapshot {
  const normalized = { EUR: 1 } as Record<FxCurrency, number>
  for (const code of DISPLAY_CURRENCIES) {
    if (code === FX_BASE_CURRENCY) continue
    const rate = rates[code]
    if (typeof rate === 'number' && rate > 0) {
      normalized[code] = rate
    }
  }
  return {
    base: FX_BASE_CURRENCY,
    rates: normalized,
    fetchedAt: Date.now()
  }
}

async function fetchFrankfurterRates(): Promise<FxRateSnapshot> {
  const symbols = DISPLAY_CURRENCIES.filter(code => code !== FX_BASE_CURRENCY).join(',')
  const response = await fetch(`${FRANKFURTER_URL}?from=${FX_BASE_CURRENCY}&to=${symbols}`)

  if (!response.ok) {
    throw createError({ statusCode: 502, message: 'Failed to fetch exchange rates' })
  }

  const data = await response.json() as { rates?: Record<string, number> }
  return buildSnapshot(data.rates ?? {})
}

export function resetFxRatesCacheForTests(): void {
  cache = null
}

export async function getFxRates(force = false): Promise<FxRateSnapshot> {
  if (!force && cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache
  }

  try {
    cache = await fetchFrankfurterRates()
    return cache
  } catch (error) {
    if (cache) return cache
    throw error
  }
}
