import type { AccountSummary, AnalyticsOverview, SubscriptionItem, TransactionsResponse } from '~/types/financial'
import type { DashboardStats } from '~/types/dashboard'
import { apiRoutes, useApi } from '~/lib/api'

export const useDashboardStore = defineStore('dashboard', () => {
  const spacesStore = useSpacesStore()
  const { api } = useApi()

  const stats = ref<DashboardStats | null>(null)
  const analytics = ref<AnalyticsOverview | null>(null)
  const recentTx = ref<TransactionsResponse | null>(null)
  const accounts = ref<AccountSummary[]>([])
  const alertSubs = ref<SubscriptionItem[]>([])
  const statsLoading = ref(false)
  const analyticsLoading = ref(false)
  const txLoading = ref(false)

  async function fetchOverview() {
    if (!spacesStore.activeSpace) return

    statsLoading.value = true
    analyticsLoading.value = true
    txLoading.value = true

    try {
      const [statsResult, analyticsResult, txResult, accountsResult, subsResult] = await Promise.all([
        api<DashboardStats>(apiRoutes.dashboard.stats),
        api<AnalyticsOverview>(apiRoutes.analytics.overview, { query: { range: '30d' } }),
        api<TransactionsResponse>(apiRoutes.transactions.list, { query: { limit: 8 } }),
        api<AccountSummary[]>(apiRoutes.accounts.list),
        api<SubscriptionItem[]>(apiRoutes.subscriptions.list, {
          query: { status: 'PRICE_CHANGED', limit: 5 }
        })
      ])

      stats.value = statsResult
      analytics.value = analyticsResult
      recentTx.value = txResult
      accounts.value = accountsResult
      alertSubs.value = subsResult
    } finally {
      statsLoading.value = false
      analyticsLoading.value = false
      txLoading.value = false
    }
  }

  watch(() => spacesStore.activeSpace?.id, (id) => {
    if (id) fetchOverview()
  }, { immediate: true })

  return {
    stats,
    analytics,
    recentTx,
    accounts,
    alertSubs,
    statsLoading,
    analyticsLoading,
    txLoading,
    fetchOverview
  }
})
