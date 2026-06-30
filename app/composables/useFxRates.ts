import type { FxRateTable } from '#shared/fx'
import { sumWithRates } from '#shared/fx'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export function useFxRates() {
  const { displayCurrency } = useAppI18n()
  const { api } = useApi()
  const rates = useState<FxRateTable | null>('fx-rates', () => null)
  const loadedBase = useState<string | null>('fx-rates-base', () => null)

  let loadPromise: Promise<FxRateTable> | null = null
  let loadPromiseBase: string | null = null

  async function ensureRates(base = displayCurrency.value): Promise<FxRateTable> {
    const normalized = base.toUpperCase()

    if (rates.value && loadedBase.value === normalized) {
      return rates.value
    }

    if (loadPromise && loadPromiseBase === normalized) {
      rates.value = await loadPromise
      loadedBase.value = normalized
      return rates.value
    }

    loadPromiseBase = normalized
    loadPromise = api<{
      base: FxRateTable['base']
      rates: FxRateTable['rates']
      presentmentRates?: FxRateTable['presentmentRates']
      fetchedAt: number
    }>(apiRoutes.fx.rates, {
      query: { base: normalized },
      noSpace: true
    }).then(payload => ({
      base: payload.base,
      rates: payload.rates,
      presentmentRates: payload.presentmentRates
    }))

    rates.value = await loadPromise
    loadedBase.value = normalized
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

  watch(displayCurrency, (next, prev) => {
    if (next === prev) return
    rates.value = null
    loadedBase.value = null
    loadPromise = null
    loadPromiseBase = null
    void ensureRates(next)
  })

  if (import.meta.client && !rates.value && !loadPromise) {
    void ensureRates()
  }

  return { rates, ensureRates, sum }
}
