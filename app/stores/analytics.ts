import type { AnalyticsOverview, AnalyticsRange } from '~/types/financial'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useAnalyticsStore = defineStore('analytics', () => {
  const { t, categoryLabel, formatCurrency, displayCurrency } = useAppI18n()
  const spacesStore = useSpacesStore()
  const syncStore = useSyncStore()
  const { api } = useApi()

  const range = ref<AnalyticsRange>('30d')
  const data = ref<AnalyticsOverview | null>(null)
  const pending = ref(false)

  const rangeTabs = computed(() => [
    { label: t('dashboard.analytics.ranges.7d'), value: '7d' },
    { label: t('dashboard.analytics.ranges.30d'), value: '30d' },
    { label: t('dashboard.analytics.ranges.90d'), value: '90d' },
    { label: t('dashboard.analytics.ranges.12m'), value: '12m' }
  ])

  const cashFlowLabels = computed(() => data.value?.cashFlow.map(p => p.period) ?? [])
  const cashFlowIncome = computed(() => data.value?.cashFlow.map(p => p.income) ?? [])
  const cashFlowSpending = computed(() => data.value?.cashFlow.map(p => p.spending) ?? [])

  const categoryLabels = computed(() =>
    (data.value?.categories ?? []).map(c => categoryLabel(c.category))
  )
  const categoryValues = computed(() =>
    (data.value?.categories ?? []).map(c => c.amount)
  )

  const merchantLabels = computed(() =>
    (data.value?.topMerchants ?? []).map(m => m.name.slice(0, 24))
  )
  const merchantValues = computed(() =>
    (data.value?.topMerchants ?? []).map(m => m.amount)
  )

  const netWorthLabels = computed(() => data.value?.netWorth.map(p => p.period) ?? [])
  const netWorthValues = computed(() => data.value?.netWorth.map(p => p.balance) ?? [])

  const hasData = computed(() => (data.value?.summary.transactionCount ?? 0) > 0)

  const summaryCurrency = computed(() => data.value?.summary.currency ?? displayCurrency.value)

  function fmt(amount: number) {
    return formatCurrency(amount, summaryCurrency.value)
  }

  async function fetchOverview() {
    if (!spacesStore.space) return
    pending.value = true
    try {
      data.value = await api<AnalyticsOverview>(apiRoutes.analytics.overview, {
        query: { range: range.value }
      })
    } finally {
      pending.value = false
    }
  }

  async function syncTransactions() {
    await syncStore.syncTransactions(fetchOverview)
  }

  watch(() => spacesStore.space?.id, () => {
    data.value = null
    fetchOverview()
  })

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
    syncTransactions
  }
})
