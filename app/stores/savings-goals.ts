// ANCHOR: Adult savings goals store
import { createSpaceScopedLoader } from '~/utils/store-fetch'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export interface SavingsGoalItem {
  id: string
  name: string
  balance: number
  target: number | null
  currency: string
  progress: number | null
}

export const useSavingsGoalsStore = defineStore('savingsGoals', () => {
  const { t, formatCurrency } = useAppI18n()
  const { api } = useApi()
  const appToast = useAppToast()

  const goals = ref<SavingsGoalItem[]>([])
  const actionPending = ref<string | null>(null)

  const { pending: loading, load: fetchGoals, reset } = createSpaceScopedLoader({
    buildKey: spaceId => `goals:${spaceId}`,
    fetch: async () => api<SavingsGoalItem[]>(apiRoutes.savingsGoals.list),
    apply: data => { goals.value = data },
    clear: () => { goals.value = [] },
    isCached: () => goals.value.length > 0
  })

  const totalSaved = computed(() =>
    goals.value.reduce((sum, goal) => sum + goal.balance, 0)
  )

  async function createGoal(input: { name: string, target?: number | null }) {
    actionPending.value = 'create'
    try {
      const goal = await api<SavingsGoalItem>(apiRoutes.savingsGoals.list, {
        method: 'POST',
        body: input
      })
      goals.value.push(goal)
      appToast.success(t('dashboard.goals.created'))
    } finally {
      actionPending.value = null
    }
  }

  async function contribute(goalId: string, amount: number) {
    actionPending.value = goalId
    try {
      const updated = await api<SavingsGoalItem>(apiRoutes.savingsGoals.contribute(goalId), {
        method: 'POST',
        body: { amount }
      })
      const idx = goals.value.findIndex(g => g.id === goalId)
      if (idx >= 0) goals.value[idx] = updated
      appToast.success(t('dashboard.goals.contributed'))
    } finally {
      actionPending.value = null
    }
  }

  function fmt(amount: number, currency?: string) {
    return formatCurrency(amount, currency)
  }

  return {
    goals,
    loading,
    actionPending,
    totalSaved,
    fetchGoals,
    createGoal,
    contribute,
    fmt,
    reset
  }
})
