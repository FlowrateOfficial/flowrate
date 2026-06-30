import { DISPLAY_CURRENCIES, type DisplayCurrency } from './currency'

export type FxCurrency = DisplayCurrency

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}

export function isFxCurrency(value: string): value is FxCurrency {
  return (DISPLAY_CURRENCIES as readonly string[]).includes(value.toUpperCase())
}

export function normalizeFxCurrency(value: string, fallback: FxCurrency = 'USD'): FxCurrency {
  const code = value.trim().toUpperCase()
  return isFxCurrency(code) ? code : fallback
}

export interface FxRateTable {
  base: FxCurrency
  rates: Record<FxCurrency, number>
  /** Stripe FX Quotes exchange_rate table (includes FX fee). */
  presentmentRates?: Partial<Record<FxCurrency, number>>
}

export function convertWithRates(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  table: FxRateTable
): number {
  const base = table.base
  const from = normalizeFxCurrency(fromCurrency, normalizeFxCurrency(toCurrency))
  const to = normalizeFxCurrency(toCurrency, from)
  if (from === to) return roundMoney(amount)

  const toBase = from === base ? amount : amount / table.rates[from]
  const converted = to === base ? toBase : toBase * table.rates[to]
  return roundMoney(converted)
}

function tableWithPresentmentRates(table: FxRateTable): FxRateTable {
  const presentment = table.presentmentRates ?? {}
  const rates = { [table.base]: 1 } as Record<FxCurrency, number>
  for (const code of DISPLAY_CURRENCIES) {
    if (code === table.base) continue
    rates[code] = presentment[code] ?? table.rates[code]
  }
  return { base: table.base, rates }
}

// Fallback when Stripe FX Quotes presentment rates are unavailable.
export const BILLING_PRESENTMENT_MARKUP = 0.039

export function convertWithPresentmentMarkup(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  table: FxRateTable
): number {
  if (normalizeFxCurrency(fromCurrency) === normalizeFxCurrency(toCurrency)) {
    return convertWithRates(amount, fromCurrency, toCurrency, table)
  }

  if (table.presentmentRates && Object.keys(table.presentmentRates).length > 1) {
    return convertWithRates(amount, fromCurrency, toCurrency, tableWithPresentmentRates(table))
  }

  const converted = convertWithRates(amount, fromCurrency, toCurrency, table)
  return roundMoney(converted * (1 + BILLING_PRESENTMENT_MARKUP))
}

export function sumWithRates(
  items: Array<{ amount: number, currency: string }>,
  toCurrency: string,
  table: FxRateTable
): number {
  return roundMoney(items.reduce(
    (total, item) => total + convertWithRates(item.amount, item.currency, toCurrency, table),
    0
  ))
}
