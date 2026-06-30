// ANCHOR: Budgets store — CRUD + space-scoped list
import type { SummaryItem } from '~/components/dashboard/SummaryStrip.vue'
import type { BudgetItem, BudgetPeriod } from '~/types/budget'
import { BUDGET_CATEGORIES } from '#shared/categories'
import { createSpaceScopedLoader, storeMoneyFormatter } from '~/utils/store-fetch'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

const CATEGORIES = BUDGET_CATEGORIES

export const useBudgetsStore = defineStore('budgets', () => {
  const { t, categoryLabel, formatCurrency, resolveCurrency } = useAppI18n()
  const { api } = useApi()

  const budgets = ref<BudgetItem[]>([])
  const isModalOpen = ref(false)
  const isSaving = ref(false)
  const editingId = ref<string | null>(null)

  const newBudget = reactive({
    name: '',
    category: 'FOOD' as (typeof CATEGORIES)[number],
    amount: '',
    period: 'MONTHLY' as BudgetPeriod,
    isShared: false
  })

  const isEditing = computed(() => editingId.value !== null)

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

  const fmt = storeMoneyFormatter(formatCurrency, resolveCurrency)

  const summaryItems = computed<SummaryItem[]>(() => [
    {
      label: t('dashboard.budgets.summary.active'),
      value: String(budgets.value.length),
      icon: 'i-lucide-pie-chart'
    },
    {
      label: t('dashboard.budgets.summary.budgeted'),
      value: fmt(totalBudgeted.value, budgets.value),
      icon: 'i-lucide-wallet'
    },
    {
      label: t('dashboard.budgets.summary.spent'),
      value: fmt(totalSpent.value, budgets.value),
      icon: 'i-lucide-arrow-up-from-line'
    },
    {
      label: t('dashboard.budgets.summary.atRisk'),
      value: String(overBudgetCount.value),
      icon: 'i-lucide-alert-triangle'
    }
  ])

  const { pending, load: fetchBudgets, reset } = createSpaceScopedLoader({
    buildKey: spaceId => `budgets:${spaceId}`,
    fetch: async () => api<BudgetItem[]>(apiRoutes.budgets.list),
    apply: data => { budgets.value = data },
    clear: () => { budgets.value = [] },
    isCached: () => budgets.value.length > 0
  })

  function resetForm() {
    newBudget.name = ''
    newBudget.amount = ''
    newBudget.category = 'FOOD'
    newBudget.period = 'MONTHLY'
    newBudget.isShared = false
    editingId.value = null
  }

  function openCreateModal() {
    resetForm()
    isModalOpen.value = true
  }

  function openEditModal(budget: BudgetItem) {
    editingId.value = budget.id
    newBudget.name = budget.name
    newBudget.category = budget.category as (typeof CATEGORIES)[number]
    newBudget.amount = String(budget.amount)
    newBudget.period = budget.period as BudgetPeriod
    newBudget.isShared = budget.isShared
    isModalOpen.value = true
  }

  function closeModal() {
    isModalOpen.value = false
    resetForm()
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
      closeModal()
      await fetchBudgets(true)
    } finally {
      isSaving.value = false
    }
  }

  async function updateBudget() {
    if (!editingId.value) return
    isSaving.value = true
    try {
      await api(apiRoutes.budgets.patch(editingId.value), {
        method: 'PATCH',
        body: {
          name: newBudget.name,
          category: newBudget.category,
          amount: parseFloat(newBudget.amount),
          period: newBudget.period,
          isShared: newBudget.isShared
        }
      })
      closeModal()
      await fetchBudgets(true)
    } finally {
      isSaving.value = false
    }
  }

  async function saveBudget() {
    if (isEditing.value) {
      await updateBudget()
    } else {
      await createBudget()
    }
  }

  async function deleteBudget(id: string) {
    await api(apiRoutes.budgets.delete(id), { method: 'DELETE' })
    await fetchBudgets(true)
  }

  return {
    budgets,
    pending,
    isModalOpen,
    isSaving,
    isEditing,
    editingId,
    newBudget,
    periodItems,
    categoryItems,
    overBudgetCount,
    summaryItems,
    fmt,
    categoryLabel,
    fetchBudgets,
    openCreateModal,
    openEditModal,
    closeModal,
    createBudget,
    updateBudget,
    saveBudget,
    deleteBudget,
    reset
  }
})
