import type { TeenDashboard } from '~/types/dashboard'
import { apiRoutes, useApi } from '~/lib/api'

export const useTeenStore = defineStore('teen', () => {
  const { api } = useApi()

  const dashboard = ref<TeenDashboard | null>(null)
  const pending = ref(false)

  async function fetchDashboard() {
    pending.value = true
    try {
      dashboard.value = await api<TeenDashboard>(apiRoutes.teen.dashboard)
    } finally {
      pending.value = false
    }
  }

  return {
    dashboard,
    pending,
    fetchDashboard
  }
})
