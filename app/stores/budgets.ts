import type { SummaryItem } from '~/components/dashboard/SummaryStrip.vue'
import { formatCurrencyForLocale } from '~/utils/format'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export interface BudgetItem {
  id: string
  name: string
  category: string
  amount: number
  currency: string
  spent: number
  period: string
  isShared: boolean
  isMine: boolean
}

const CATEGORIES = [
  'FOOD', 'TRANSPORT', 'SUBSCRIPTIONS', 'HOUSING', 'UTILITIES',
  'HEALTHCARE', 'ENTERTAINMENT', 'SHOPPING', 'SAVINGS', 'CLOUD_INFRA',
  'DEVELOPER_TOOLS', 'OTHER'
] as const

export const useBudgetsStore = defineStore('budgets', () => {
  const { t, getLocale, categoryLabel } = useAppI18n()
  const spacesStore = useSpacesStore()
  const { api } = useApi()

  const budgets = ref<BudgetItem[]>([])
  const pending = ref(false)
  const isModalOpen = ref(false)
  const isSaving = ref(false)

  const newBudget = reactive({
    name: '',
    category: 'FOOD',
    amount: '',
    period: 'MONTHLY' as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    isShared: false
  })

  const periodItems = computed(() => [
    { label: t('frequencies.WEEKLY'), value: 'WEEKLY' },
    { label: t('frequencies.MONTHLY'), value: 'MONTHLY' },
    { label: t('frequencies.YEARLY'), value: 'YEARLY' }
  ])

  const categoryItems = computed(() =>
    CATEGORIES.map(c => ({ label: categoryLabel(c), value: c }))
  )

  const overBudgetCount = computed(() =>
    budgets.value.filter(b => b.amount > 0 && (b.spent / b.amount) >= 0.9).length
  )

  const totalBudgeted = computed(() =>
    budgets.value.reduce((s, b) => s + b.amount, 0)
  )

  const totalSpent = computed(() =>
    budgets.value.reduce((s, b) => s + b.spent, 0)
  )

  const summaryItems = computed<SummaryItem[]>(() => [
    {
      label: t('dashboard.budgets.summary.active'),
      value: String(budgets.value.length),
      icon: 'i-lucide-pie-chart'
    },
    {
      label: t('dashboard.budgets.summary.budgeted'),
      value: fmt(totalBudgeted.value),
      icon: 'i-lucide-wallet'
    },
    {
      label: t('dashboard.budgets.summary.spent'),
      value: fmt(totalSpent.value),
      icon: 'i-lucide-arrow-up-from-line'
    },
    {
      label: t('dashboard.budgets.summary.atRisk'),
      value: String(overBudgetCount.value),
      icon: 'i-lucide-alert-triangle'
    }
  ])

  function fmt(amount: number) {
    return formatCurrencyForLocale(amount, getLocale(), 'USD')
  }

  async function fetchBudgets() {
    if (!spacesStore.activeSpace) return
    pending.value = true
    try {
      budgets.value = await api<BudgetItem[]>(apiRoutes.budgets.list)
    } finally {
      pending.value = false
    }
  }

  async function createBudget() {
    isSaving.value = true
    try {
      await api(apiRoutes.budgets.list, {
        method: 'POST',
        body: {
          name: newBudget.name,
          category: newBudget.category,
          amount: parseFloat(newBudget.amount),
          period: newBudget.period,
          isShared: newBudget.isShared
        }
      })
      newBudget.name = ''
      newBudget.amount = ''
      newBudget.category = 'FOOD'
      newBudget.period = 'MONTHLY'
      newBudget.isShared = false
      isModalOpen.value = false
      await fetchBudgets()
    } finally {
      isSaving.value = false
    }
  }

  async function deleteBudget(id: string) {
    await api(apiRoutes.budgets.delete(id), { method: 'DELETE' })
    await fetchBudgets()
  }

  watch(() => spacesStore.activeSpace?.id, () => {
    fetchBudgets()
  })

  return {
    budgets,
    pending,
    isModalOpen,
    isSaving,
    newBudget,
    periodItems,
    categoryItems,
    overBudgetCount,
    summaryItems,
    fmt,
    categoryLabel,
    fetchBudgets,
    createBudget,
    deleteBudget
  }
})
