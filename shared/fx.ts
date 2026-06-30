import { DISPLAY_CURRENCIES, type DisplayCurrency } from './currency'

export const FX_BASE_CURRENCY = 'EUR' as const

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
  base: typeof FX_BASE_CURRENCY
  rates: Record<FxCurrency, number>
}

export function convertWithRates(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  table: FxRateTable
): number {
  const from = normalizeFxCurrency(fromCurrency, normalizeFxCurrency(toCurrency))
  const to = normalizeFxCurrency(toCurrency, from)
  if (from === to) return roundMoney(amount)

  const toEur = from === 'EUR' ? amount : amount / table.rates[from]
  const converted = to === 'EUR' ? toEur : toEur * table.rates[to]
  return roundMoney(converted)
}

// Stripe Checkout adaptive pricing quotes ~3.9% above ECB mid-market (incl. conversion fee).
export const BILLING_PRESENTMENT_MARKUP = 0.039

export function convertWithPresentmentMarkup(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  table: FxRateTable
): number {
  const converted = convertWithRates(amount, fromCurrency, toCurrency, table)
  if (normalizeFxCurrency(fromCurrency) === normalizeFxCurrency(toCurrency)) {
    return converted
  }
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
