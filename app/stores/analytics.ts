// ANCHOR: Analytics store — range-scoped overview + chart series
import type { AnalyticsOverview, AnalyticsRange } from '~/types/financial'
import {
  cashFlowSeries,
  categorySeries,
  merchantSeries,
  netWorthSeries
} from '~/utils/analytics-series'
import { createSpaceScopedLoader } from '~/utils/store-fetch'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useAnalyticsStore = defineStore('analytics', () => {
  const { t, categoryLabel, formatCurrency, displayCurrency, getLocale } = useAppI18n()
  const syncStore = useSyncStore()
  const { api } = useApi()

  const range = ref<AnalyticsRange>('30d')
  const data = ref<AnalyticsOverview | null>(null)

  const { pending, load: fetchOverview, reset } = createSpaceScopedLoader({
    buildKey: spaceId => `analytics:${spaceId}:${range.value}:${getLocale()}`,
    fetch: async () => api<AnalyticsOverview>(apiRoutes.analytics.overview, {
      query: { range: range.value, locale: getLocale() }
    }),
    apply: payload => { data.value = payload },
    clear: () => { data.value = null },
    isCached: () => data.value != null
  })

  const rangeTabs = computed(() => [
    { label: t('dashboard.analytics.ranges.7d'), value: '7d' },
    { label: t('dashboard.analytics.ranges.30d'), value: '30d' },
    { label: t('dashboard.analytics.ranges.90d'), value: '90d' },
    { label: t('dashboard.analytics.ranges.12m'), value: '12m' }
  ])

  const cashFlow = computed(() => cashFlowSeries(data.value))
  const cashFlowLabels = computed(() => cashFlow.value.labels)
  const cashFlowIncome = computed(() => cashFlow.value.income)
  const cashFlowSpending = computed(() => cashFlow.value.spending)

  const categories = computed(() => categorySeries(data.value, categoryLabel))
  const categoryLabels = computed(() => categories.value.labels)
  const categoryValues = computed(() => categories.value.values)

  const merchants = computed(() => merchantSeries(data.value))
  const merchantLabels = computed(() => merchants.value.labels)
  const merchantValues = computed(() => merchants.value.values)

  const netWorth = computed(() => netWorthSeries(data.value))
  const netWorthLabels = computed(() => netWorth.value.labels)
  const netWorthValues = computed(() => netWorth.value.values)

  const hasData = computed(() => (data.value?.summary.transactionCount ?? 0) > 0)

  const summaryCurrency = computed(() => displayCurrency.value)

  function fmt(amount: number) {
    return formatCurrency(amount, summaryCurrency.value)
  }

  async function syncTransactions() {
    await syncStore.syncTransactions(fetchOverview)
  }

  return {
    range,
    data,
    pending,
    rangeTabs,
    cashFlowLabels,
    cashFlowIncome,
    cashFlowSpending,
    categoryLabels,
    categoryValues,
    merchantLabels,
    merchantValues,
    netWorthLabels,
    netWorthValues,
    hasData,
    summaryCurrency,
    isSyncing: computed(() => syncStore.isSyncing),
    fmt,
    categoryLabel,
    fetchOverview,
    syncTransactions,
    reset
  }
})
