// ANCHOR: Chart axis and tooltip currency formatters
import { formatCompactMoney } from '#shared/currency'

export function useChartCurrency(currency?: MaybeRef<string | undefined>) {
  const { getLocale, displayCurrency, formatCurrency } = useAppI18n()

  const resolvedCurrency = computed(() => unref(currency) ?? displayCurrency.value)

  function formatAxis(value: string | number) {
    return formatCompactMoney(Number(value), getLocale(), resolvedCurrency.value)
  }

  function formatTooltip(value: number) {
    return formatCurrency(value, resolvedCurrency.value)
  }

  return {
    resolvedCurrency,
    formatAxis,
    formatTooltip
  }
}
