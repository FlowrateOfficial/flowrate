import { defineStore } from 'pinia'
import type { SubscriptionItem } from '~/types/financial'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const spacesStore = useSpacesStore()
  const { api } = useApi()
  const subscriptions = ref<SubscriptionItem[]>([])
  const loading = ref(false)

  async function fetchSubscriptions(spaceId?: string) {
    const id = spaceId ?? spacesStore.space?.id
    if (!id) return
    loading.value = true
    try {
      subscriptions.value = await api<SubscriptionItem[]>(apiRoutes.subscriptions.list)
    } finally {
      loading.value = false
    }
  }

  const monthlyTotal = computed(() =>
    subscriptions.value.reduce((sum, s) => sum + (s.amount ?? 0), 0)
  )

  const activeCount = computed(() => subscriptions.value.filter(s => s.status === 'ACTIVE').length)

  return {
    subscriptions,
    loading,
    monthlyTotal,
    activeCount,
    fetchSubscriptions
  }
})
