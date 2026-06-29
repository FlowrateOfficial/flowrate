// ANCHOR: Dashboard store — composite overview payload
import type { AnalyticsOverview, SubscriptionItem, TransactionsResponse } from '~/types/financial'
import type { DashboardOverview, DashboardStats } from '~/types/dashboard'
import { planHasFeature } from '#shared/plan-limits'
import { useActivePlan } from '~/composables/useActivePlan'
import { cashFlowSeries, categorySeries } from '~/utils/analytics-series'
import { createSpaceScopedLoader, storeMoneyFormatter } from '~/utils/store-fetch'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

type OverviewPayload = {
  stats: DashboardStats
  analytics: AnalyticsOverview
  transactions: TransactionsResponse
  accounts: DashboardOverview['accounts']
  alertSubscriptions: SubscriptionItem[]
}

export const useDashboardStore = defineStore('dashboard', () => {
  const { t, categoryLabel, formatCurrency, resolveCurrency, displayCurrency } = useAppI18n()
  const spacesStore = useSpacesStore()
  const accountsStore = useAccountsStore()
  const analyticsStore = useAnalyticsStore()
  const { api } = useApi()
  const activePlan = useActivePlan()

  const stats = ref<DashboardStats | null>(null)
  const analytics = ref<AnalyticsOverview | null>(null)
  const recentTx = ref<TransactionsResponse | null>(null)
  const alertSubs = ref<SubscriptionItem[]>([])

  const fmt = storeMoneyFormatter(formatCurrency, resolveCurrency)

  const spaceTypeLabel = computed(() =>
    spacesStore.spaceType(spacesStore.space?.type ?? 'INDEPENDENT')
  )

  const spaceName = computed(() => spacesStore.space?.name ?? 'Your')

  const runwayLabel = computed(() => {
    if (stats.value?.runwayMonths == null) return '—'
    if (stats.value.runwayMonths > 99) return '∞'
    return `${stats.value.runwayMonths} mo`
  })

  const cashFlow = computed(() => cashFlowSeries(analytics.value))
  const cashFlowLabels = computed(() => cashFlow.value.labels)
  const cashFlowIncome = computed(() => cashFlow.value.income)
  const cashFlowSpending = computed(() => cashFlow.value.spending)
  const hasCashFlow = computed(() => cashFlowLabels.value.length > 0)

  const categories = computed(() => categorySeries(analytics.value, categoryLabel, 6))
  const categoryLabels = computed(() => categories.value.labels)
  const categoryValues = computed(() => categories.value.values)
  const hasCategoryChart = computed(() => categoryValues.value.length > 0)

  const summaryCurrency = computed(
    () => analytics.value?.summary.currency ?? resolveCurrency(accountsStore.accounts) ?? displayCurrency.value
  )

  const saasShieldCenterValue = computed(() => String(stats.value?.subscriptionAlerts ?? 0))

  const showSaasShield = computed(() => planHasFeature(activePlan.value, 'saasShield'))

  const statCards = computed(() => {
    const cards = [
      {
        key: 'balance',
        title: t('dashboard.overview.stats.totalBalance'),
        value: stats.value?.totalBalance != null ? fmt(stats.value.totalBalance, accountsStore.accounts) : '—',
        change: stats.value?.balanceChange,
        changePositive: !stats.value?.balanceChange?.startsWith('-'),
        icon: 'i-lucide-wallet'
      },
      {
        key: 'savings',
        title: t('dashboard.overview.stats.netSavings'),
        value: stats.value?.netSavings != null ? fmt(stats.value.netSavings, accountsStore.accounts) : '—',
        change: stats.value?.savingsChange,
        changePositive: !stats.value?.savingsChange?.startsWith('-'),
        icon: 'i-lucide-arrow-left-right'
      },
      {
        key: 'burn',
        title: t('dashboard.overview.stats.burnRate'),
        value: stats.value?.burnRate != null ? `${fmt(stats.value.burnRate, accountsStore.accounts)}/mo` : '—',
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
    ]

    if (!showSaasShield.value) {
      return cards.filter(card => card.key !== 'burn' && card.key !== 'runway')
    }

    return cards
  })

  const previewAccounts = computed(() =>
    accountsStore.accounts.slice(0, 5).map(acc => ({
      id: acc.id,
      name: acc.name,
      subtitle: acc.institution ?? acc.type,
      balanceLabel: fmt(acc.balance, accountsStore.accounts, acc.currency)
    }))
  )

  const hasAccounts = computed(() => accountsStore.accounts.length > 0)
  const hasAlertSubs = computed(() => alertSubs.value.length > 0)
  const previewAlertSubs = computed(() => alertSubs.value.slice(0, 3))
  const recentTransactions = computed(() => recentTx.value?.items ?? [])

  const { pending: overviewLoading, load: fetchOverview, reset } = createSpaceScopedLoader<OverviewPayload>({
    buildKey: spaceId => `overview:${spaceId}`,
    fetch: async () => api<OverviewPayload>(apiRoutes.dashboard.overview),
    apply: (payload) => {
      stats.value = payload.stats
      analytics.value = payload.analytics
      recentTx.value = payload.transactions
      alertSubs.value = payload.alertSubscriptions
      accountsStore.seedAccounts(payload.accounts)

      // NOTE - Share 30d analytics cache when overview already fetched it
      if (analyticsStore.range === '30d') {
        analyticsStore.data = payload.analytics
      }
    },
    clear: () => {
      stats.value = null
      analytics.value = null
      recentTx.value = null
      alertSubs.value = []
    },
    isCached: () => stats.value != null
  })

  return {
    stats,
    analytics,
    recentTx,
    alertSubs,
    statsLoading: overviewLoading,
    analyticsLoading: overviewLoading,
    txLoading: overviewLoading,
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
    summaryCurrency,
    saasShieldCenterValue,
    showSaasShield,
    statCards,
    previewAccounts,
    hasAccounts,
    hasAlertSubs,
    previewAlertSubs,
    recentTransactions,
    fetchOverview,
    reset
  }
})
