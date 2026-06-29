// ANCHOR: Subscriptions store — recurring charges + alerts
import type { SummaryItem } from '~/components/dashboard/SummaryStrip.vue'
import type { SubscriptionItem } from '~/types/financial'
import { createSpaceScopedLoader } from '~/utils/store-fetch'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const { t, formatCurrency, resolveCurrency } = useAppI18n()
  const { api } = useApi()

  const subscriptions = ref<SubscriptionItem[]>([])

  const { pending: loading, load: fetchSubscriptions, reset } = createSpaceScopedLoader({
    buildKey: spaceId => `subs:${spaceId}`,
    fetch: async () => api<SubscriptionItem[]>(apiRoutes.subscriptions.list),
    apply: data => { subscriptions.value = data },
    clear: () => { subscriptions.value = [] },
    isCached: () => subscriptions.value.length > 0
  })

  const monthlyTotal = computed(() =>
    subscriptions.value.reduce((sum, s) => sum + (s.amount ?? 0), 0)
  )

  const activeCount = computed(() =>
    subscriptions.value.filter(s => s.status === 'ACTIVE').length
  )

  const alertSubs = computed(() =>
    subscriptions.value.filter(s => s.status === 'PRICE_CHANGED')
  )

  const summaryItems = computed<SummaryItem[]>(() => [
    {
      label: t('dashboard.subscriptions.active'),
      value: String(activeCount.value),
      icon: 'i-lucide-repeat'
    },
    {
      label: t('dashboard.subscriptions.monthlyTotal'),
      value: formatCurrency(monthlyTotal.value, resolveCurrency(subscriptions.value)),
      icon: 'i-lucide-calendar'
    }
  ])

  return {
    subscriptions,
    loading,
    monthlyTotal,
    activeCount,
    alertSubs,
    summaryItems,
    fetchSubscriptions,
    reset
  }
})
