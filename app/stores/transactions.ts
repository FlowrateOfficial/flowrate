import type { TableColumn } from '@nuxt/ui'
import type { TransactionRow, TransactionsResponse } from '~/types/financial'
import { formatCurrencyForLocale } from '~/utils/format'
import { apiRoutes, useApi } from '~/lib/api'

const CATEGORY_OPTIONS = [
  'ALL', 'FOOD', 'TRANSPORT', 'SUBSCRIPTIONS', 'HOUSING', 'UTILITIES',
  'HEALTHCARE', 'ENTERTAINMENT', 'SHOPPING', 'SAVINGS', 'INCOME',
  'CLOUD_INFRA', 'DEVELOPER_TOOLS', 'OTHER'
] as const

export type CategoryFilter = (typeof CATEGORY_OPTIONS)[number]

const PAGE_SIZE = 25

export const useTransactionsStore = defineStore('transactions', () => {
  const { t, getLocale, categoryLabel, intlLocale } = useAppI18n()
  const spacesStore = useSpacesStore()
  const { api } = useApi()

  const selectedCategory = ref<CategoryFilter>('ALL')
  const search = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const page = ref(1)
  const data = ref<TransactionsResponse | null>(null)
  const pending = ref(false)
  const selectedTx = ref<TransactionRow | null>(null)
  const detailOpen = ref(false)

  const columns = computed<TableColumn<TransactionRow>[]>(() => [
    { accessorKey: 'date', header: t('dashboard.transactions.columns.date') },
    { accessorKey: 'description', header: t('dashboard.transactions.columns.description') },
    { accessorKey: 'category', header: t('dashboard.transactions.columns.category') },
    { accessorKey: 'account', header: t('dashboard.transactions.columns.account') },
    {
      accessorKey: 'amount',
      header: t('dashboard.transactions.columns.amount'),
      meta: { class: { th: 'text-right', td: 'text-right' } }
    }
  ])

  const rows = computed(() => data.value?.items ?? [])

  const categorySelectItems = computed(() =>
    CATEGORY_OPTIONS.map(cat => ({
      label: categoryLabel(cat),
      value: cat
    }))
  )

  function formatAmount(amount: number, currency: string): string {
    return formatCurrencyForLocale(Math.abs(amount), getLocale(), currency)
  }

  function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat(intlLocale.value, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateStr))
  }

  function clearFilters() {
    selectedCategory.value = 'ALL'
    search.value = ''
    dateFrom.value = ''
    dateTo.value = ''
    page.value = 1
  }

  function openDetail(tx: TransactionRow) {
    selectedTx.value = tx
    detailOpen.value = true
  }

  async function updateCategory(id: string, category: string) {
    const updated = await api<TransactionRow>(apiRoutes.transactions.patch(id), {
      method: 'PATCH',
      body: { category }
    })
    if (selectedTx.value?.id === id) selectedTx.value = updated
    await fetchTransactions()
  }

  async function fetchTransactions() {
    if (!spacesStore.activeSpace) return
    pending.value = true
    try {
      data.value = await api<TransactionsResponse>(apiRoutes.transactions.list, {
        query: {
          category: selectedCategory.value === 'ALL' ? undefined : selectedCategory.value,
          search: search.value || undefined,
          dateFrom: dateFrom.value ? new Date(dateFrom.value).toISOString() : undefined,
          dateTo: dateTo.value ? new Date(dateTo.value).toISOString() : undefined,
          page: page.value,
          limit: PAGE_SIZE
        }
      })
    } finally {
      pending.value = false
    }
  }

  async function exportCsv() {
    const csv = await api<string>(apiRoutes.transactions.export)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'flowrate-transactions.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  watch([selectedCategory, search, dateFrom, dateTo], () => {
    if (page.value !== 1) {
      page.value = 1
      return
    }
    fetchTransactions()
  })

  watch(page, () => fetchTransactions())

  watch(() => spacesStore.activeSpace?.id, (id) => {
    if (id) fetchTransactions()
  }, { immediate: true })

  return {
    selectedCategory,
    search,
    dateFrom,
    dateTo,
    page,
    pageSize: PAGE_SIZE,
    data,
    pending,
    selectedTx,
    detailOpen,
    columns,
    rows,
    categorySelectItems,
    formatAmount,
    formatDate,
    categoryLabel,
    clearFilters,
    openDetail,
    updateCategory,
    fetchTransactions,
    exportCsv
  }
})
