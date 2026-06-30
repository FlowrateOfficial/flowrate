import { convertWithRates } from '#shared/fx'

/** Convert foreign amounts into the active locale display currency. */
export function useDisplayMoney() {
  const { displayCurrency, formatCurrency } = useAppI18n()
  const { rates, ensureRates } = useFxRates()

  function convert(amount: number, fromCurrency: string): number {
    if (!rates.value) return amount
    return convertWithRates(amount, fromCurrency, displayCurrency.value, rates.value)
  }

  function format(amount: number, fromCurrency: string): string {
    if (!rates.value) {
      void ensureRates()
      return formatCurrency(amount, fromCurrency)
    }
    return formatCurrency(convert(amount, fromCurrency), displayCurrency.value)
  }

  return { convert, format, displayCurrency, ensureRates }
}
