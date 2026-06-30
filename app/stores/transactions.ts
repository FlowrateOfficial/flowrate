// ANCHOR: Transactions store — filters, pagination, export
import type { TransactionRow, TransactionsResponse } from '~/types/financial'
import { TRANSACTION_FILTER_CATEGORIES, type TransactionCategoryFilter } from '#shared/categories'
import { createTransactionColumns } from '~/utils/table-columns'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'
import { toIsoDateTime } from '~/utils/date-pickers'

export type CategoryFilter = TransactionCategoryFilter

const CATEGORY_OPTIONS = TRANSACTION_FILTER_CATEGORIES

const PAGE_SIZE = 50

export const useTransactionsStore = defineStore('transactions', () => {
  const { t, categoryLabel, formatCurrency, formatShortDateWithYear } = useAppI18n()
  const spacesStore = useSpacesStore()
  const { api } = useApi()

  const selectedCategory = ref<CategoryFilter>('ALL')
  const search = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const timeFrom = ref('')
  const timeTo = ref('')
  const items = ref<TransactionRow[]>([])
  const total = ref(0)
  const pending = ref(false)
  const loadingMore = ref(false)
  const selectedTx = ref<TransactionRow | null>(null)
  const detailOpen = ref(false)

  let fetchSeq = 0
  let abortController: AbortController | null = null
  let skipWatch = false

  const hasMore = computed(() => items.value.length < total.value)
  const loadedCount = computed(() => items.value.length)

  const columns = computed(() =>
    createTransactionColumns<TransactionRow>(t, {
      includeAccount: true,
      includeSplit: spacesStore.isSharedSpace
    })
  )

  const categorySelectItems = computed(() =>
    CATEGORY_OPTIONS.map(cat => ({
      label: categoryLabel(cat),
      value: cat
    }))
  )

  function formatAmount(amount: number, currency: string): string {
    return formatCurrency(Math.abs(amount), currency)
  }

  function formatDate(dateStr: string): string {
    return formatShortDateWithYear(dateStr)
  }

  function clearFilters() {
    skipWatch = true
    selectedCategory.value = 'ALL'
    search.value = ''
    dateFrom.value = ''
    dateTo.value = ''
    timeFrom.value = ''
    timeTo.value = ''
    skipWatch = false
    resetAndFetch()
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
    await resetAndFetch()
  }

  async function fetchTransactions(options: { append?: boolean, page?: number } = {}) {
    if (!spacesStore.space) return

    const append = options.append ?? false
    const requestPage = options.page ?? 1

    if (append) {
      if (!hasMore.value || loadingMore.value || pending.value) return
    }

    const seq = ++fetchSeq
    abortController?.abort()
    abortController = new AbortController()

    if (append) {
      loadingMore.value = true
    } else {
      pending.value = true
    }

    try {
      const result = await api<TransactionsResponse>(apiRoutes.transactions.list, {
        query: {
          category: selectedCategory.value === 'ALL' ? undefined : selectedCategory.value,
          search: search.value.trim() || undefined,
          dateFrom: dateFrom.value ? toIsoDateTime(dateFrom.value, timeFrom.value || undefined, 'start') : undefined,
          dateTo: dateTo.value ? toIsoDateTime(dateTo.value, timeTo.value || undefined, 'end') : undefined,
          page: requestPage,
          limit: PAGE_SIZE
        },
        signal: abortController.signal
      })

      if (seq !== fetchSeq) return

      total.value = result.total

      if (append) {
        const existingIds = new Set(items.value.map(item => item.id))
        const fresh = result.items.filter(item => !existingIds.has(item.id))
        items.value = [...items.value, ...fresh]
      } else {
        items.value = result.items
      }
    } catch (error) {
      if (seq !== fetchSeq) return
      if (error instanceof DOMException && error.name === 'AbortError') return
      throw error
    } finally {
      if (seq === fetchSeq) {
        pending.value = false
        loadingMore.value = false
      }
    }
  }

  async function resetAndFetch() {
    items.value = []
    total.value = 0
    await fetchTransactions()
  }

  async function loadMore() {
    if (!hasMore.value || pending.value || loadingMore.value) return
    const nextPage = Math.floor(items.value.length / PAGE_SIZE) + 1
    await fetchTransactions({ append: true, page: nextPage })
  }

  async function exportCsv() {
    await downloadExport(apiRoutes.transactions.export, 'flowrate-transactions.csv')
  }

  async function exportAuditCsv() {
    await downloadExport(`${apiRoutes.transactions.export}?audit=1`, 'flowrate-transactions-audit.csv')
  }

  async function downloadExport(url: string, filename: string) {
    const csv = await api<string>(url)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  let searchDebounce: ReturnType<typeof setTimeout> | null = null
  watch(search, () => {
    if (skipWatch) return
    if (searchDebounce) clearTimeout(searchDebounce)
    searchDebounce = setTimeout(resetAndFetch, 300)
  })

  watch([selectedCategory, dateFrom, dateTo, timeFrom, timeTo], () => {
    if (skipWatch) return
    resetAndFetch()
  })

  watch(() => spacesStore.space?.id, (id, previousId) => {
    if (!id || previousId === undefined) return
    if (id !== previousId) {
      skipWatch = true
      selectedCategory.value = 'ALL'
      search.value = ''
      dateFrom.value = ''
      dateTo.value = ''
      timeFrom.value = ''
      timeTo.value = ''
      skipWatch = false
      items.value = []
      total.value = 0
      resetAndFetch()
    }
  })

  return {
    selectedCategory,
    search,
    dateFrom,
    dateTo,
    timeFrom,
    timeTo,
    items,
    total,
    loadedCount,
    hasMore,
    pending,
    loadingMore,
    selectedTx,
    detailOpen,
    columns,
    pageSize: PAGE_SIZE,
    categorySelectItems,
    formatAmount,
    formatDate,
    categoryLabel,
    clearFilters,
    openDetail,
    updateCategory,
    fetchTransactions,
    resetAndFetch,
    loadMore,
    exportCsv,
    exportAuditCsv
  }
})
