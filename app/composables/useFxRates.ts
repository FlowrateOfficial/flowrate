import type { FxRateTable } from '#shared/fx'
import { sumWithRates } from '#shared/fx'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

let loadPromise: Promise<FxRateTable> | null = null

export function useFxRates() {
  const { displayCurrency } = useAppI18n()
  const { api } = useApi()
  const rates = useState<FxRateTable | null>('fx-rates', () => null)

  async function ensureRates(): Promise<FxRateTable> {
    if (rates.value) return rates.value
    if (!loadPromise) {
      loadPromise = api<{ base: 'EUR', rates: FxRateTable['rates'], fetchedAt: number }>(
        apiRoutes.fx.rates,
        { noSpace: true }
      ).then((payload) => ({
        base: payload.base,
        rates: payload.rates
      }))
    }
    rates.value = await loadPromise
    return rates.value
  }

  function sum(
    items: Array<{ amount: number, currency: string }>,
    targetCurrency = displayCurrency.value
  ): number {
    if (!rates.value) {
      return items.reduce((total, item) => total + item.amount, 0)
    }
    return sumWithRates(items, targetCurrency, rates.value)
  }

  if (import.meta.client && !rates.value && !loadPromise) {
    void ensureRates()
  }

  return { rates, ensureRates, sum }
}
