import type { AccountSummary, AnalyticsOverview, SubscriptionItem, TransactionsResponse } from '~/types/financial'
import type { DashboardStats } from '~/types/dashboard'
import { formatCurrencyForLocale } from '~/utils/format'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useDashboardStore = defineStore('dashboard', () => {
  const { t, getLocale, categoryLabel } = useAppI18n()
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

  function fmt(amount: number, currency = 'USD') {
    return formatCurrencyForLocale(amount, getLocale(), currency)
  }

  const spaceTypeLabel = computed(() =>
    spacesStore.spaceType(spacesStore.activeSpace?.type ?? 'INDEPENDENT')
  )

  const spaceName = computed(() => spacesStore.activeSpace?.name ?? 'Your')

  const runwayLabel = computed(() => {
    if (stats.value?.runwayMonths == null) return '—'
    if (stats.value.runwayMonths > 99) return '∞'
    return `${stats.value.runwayMonths} mo`
  })

  const cashFlowLabels = computed(() => analytics.value?.cashFlow.map(p => p.period) ?? [])
  const cashFlowIncome = computed(() => analytics.value?.cashFlow.map(p => p.income) ?? [])
  const cashFlowSpending = computed(() => analytics.value?.cashFlow.map(p => p.spending) ?? [])
  const hasCashFlow = computed(() => cashFlowLabels.value.length > 0)

  const categoryLabels = computed(() =>
    (analytics.value?.categories ?? []).slice(0, 6).map(c => categoryLabel(c.category))
  )
  const categoryValues = computed(() =>
    (analytics.value?.categories ?? []).slice(0, 6).map(c => c.amount)
  )
  const hasCategoryChart = computed(() => categoryValues.value.length > 0)

  const saasShieldCenterValue = computed(() => String(stats.value?.subscriptionAlerts ?? 0))

  const statCards = computed(() => [
    {
      key: 'balance',
      title: t('dashboard.overview.stats.totalBalance'),
      value: stats.value?.totalBalance != null ? fmt(stats.value.totalBalance) : '—',
      change: stats.value?.balanceChange,
      changePositive: !stats.value?.balanceChange?.startsWith('-'),
      icon: 'i-lucide-wallet'
    },
    {
      key: 'savings',
      title: t('dashboard.overview.stats.netSavings'),
      value: stats.value?.netSavings != null ? fmt(stats.value.netSavings) : '—',
      change: stats.value?.savingsChange,
      changePositive: !stats.value?.savingsChange?.startsWith('-'),
      icon: 'i-lucide-arrow-left-right'
    },
    {
      key: 'burn',
      title: t('dashboard.overview.stats.burnRate'),
      value: stats.value?.burnRate != null ? `${fmt(stats.value.burnRate)}/mo` : '—',
      change: stats.value?.burnRateChange,
      changePositive: stats.value?.burnRateChange?.startsWith('-'),
      icon: 'i-lucide-flame'
    },
    {
      key: 'runway',
      title: t('dashboard.overview.stats.runway'),
      value: runwayLabel.value,
      change: null,
      changePositive: true,
      icon: 'i-lucide-hourglass'
    }
  ])

  const previewAccounts = computed(() =>
    accounts.value.slice(0, 5).map(acc => ({
      id: acc.id,
      name: acc.name,
      subtitle: acc.institution ?? acc.type,
      balanceLabel: fmt(acc.balance, acc.currency)
    }))
  )

  const hasAccounts = computed(() => accounts.value.length > 0)
  const hasAlertSubs = computed(() => alertSubs.value.length > 0)
  const previewAlertSubs = computed(() => alertSubs.value.slice(0, 3))
  const recentTransactions = computed(() => recentTx.value?.items ?? [])

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
  })

  return {
    stats,
    analytics,
    recentTx,
    accounts,
    alertSubs,
    statsLoading,
    analyticsLoading,
    txLoading,
    spaceTypeLabel,
    spaceName,
    runwayLabel,
    cashFlowLabels,
    cashFlowIncome,
    cashFlowSpending,
    hasCashFlow,
    categoryLabels,
    categoryValues,
    hasCategoryChart,
    saasShieldCenterValue,
    statCards,
    previewAccounts,
    hasAccounts,
    hasAlertSubs,
    previewAlertSubs,
    recentTransactions,
    fetchOverview
  }
})
