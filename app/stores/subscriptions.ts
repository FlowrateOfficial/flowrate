// ANCHOR: Subscriptions store — recurring charges + alerts + calendar
import type { SummaryItem } from '~/components/dashboard/SummaryStrip.vue'
import type { SubscriptionItem } from '~/types/financial'
import type { RenewalCalendarResponse, SubscriptionCapStatusDto } from '#shared/api/subscriptions'
import type { SubscriptionStatus } from '#shared/prisma-enums'
import { ENUM } from '#shared/prisma-enums'
import { subscriptionMonthlyEquivalent } from '#shared/subscription-alerts'
import { createSpaceScopedLoader } from '~/utils/store-fetch'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export type SubscriptionFilter = 'all' | SubscriptionStatus

export type SubscriptionPatchInput = {
  displayName?: string | null
  hidden?: boolean
  excluded?: boolean
}

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const { t, formatCurrency, resolveCurrency, subscriptionFrequencyLabel, displayCurrency } = useAppI18n()
  const { api } = useApi()
  const appToast = useAppToast()
  const fx = useFxRates()

  const subscriptions = ref<SubscriptionItem[]>([])
  const statusFilter = ref<SubscriptionFilter>('all')
  const actionPending = ref<string | null>(null)
  const calendar = ref<RenewalCalendarResponse | null>(null)
  const capStatus = ref<SubscriptionCapStatusDto | null>(null)
  const calendarPending = ref(false)

  const { pending: loading, load: fetchSubscriptions, reset } = createSpaceScopedLoader({
    buildKey: spaceId => `subs:${spaceId}:${statusFilter.value}`,
    fetch: async () => {
      const [items, cap] = await Promise.all([
        api<SubscriptionItem[]>(apiRoutes.subscriptions.list, {
          query: statusFilter.value === 'all' ? {} : { status: statusFilter.value }
        }),
        api<SubscriptionCapStatusDto | null>(apiRoutes.subscriptions.capStatus)
      ])
      capStatus.value = cap
      return items
    },
    apply: data => { subscriptions.value = data },
    clear: () => {
      subscriptions.value = []
      capStatus.value = null
    },
    isCached: () => subscriptions.value.length > 0
  })

  const filterItems = computed(() => [
    { label: t('dashboard.subscriptions.filters.all'), value: 'all' as const },
    { label: t('dashboard.subscriptions.filters.active'), value: ENUM.subscription.ACTIVE },
    { label: t('dashboard.subscriptions.filters.priceChanged'), value: ENUM.subscription.PRICE_CHANGED },
    { label: t('dashboard.subscriptions.filters.paused'), value: ENUM.subscription.PAUSED },
    { label: t('dashboard.subscriptions.filters.cancelled'), value: ENUM.subscription.CANCELLED }
  ])

  async function setFilter(filter: SubscriptionFilter) {
    if (statusFilter.value === filter) return
    statusFilter.value = filter
    subscriptions.value = []
    await fetchSubscriptions()
  }

  const monthlyTotal = computed(() => {
    const items = subscriptions.value.map(sub => ({
      amount: subscriptionMonthlyEquivalent(sub.amount, sub.frequency ?? ENUM.period.MONTHLY),
      currency: sub.currency
    }))
    return fx.sum(items, displayCurrency.value)
  })

  const activeCount = computed(() =>
    subscriptions.value.filter(s => s.status === ENUM.subscription.ACTIVE).length
  )

  const alertSubs = computed(() =>
    subscriptions.value.filter(s => s.alert)
  )

  const totalAnnualImpact = computed(() =>
    alertSubs.value.reduce((sum, s) => sum + (s.annualPriceImpact ?? 0), 0)
  )

  const summaryItems = computed<SummaryItem[]>(() => [
    {
      label: t('dashboard.subscriptions.active'),
      value: String(activeCount.value),
      icon: 'i-lucide-repeat'
    },
    {
      label: t('dashboard.subscriptions.monthlyTotal'),
      value: formatCurrency(monthlyTotal.value, displayCurrency.value),
      icon: 'i-lucide-calendar'
    }
  ])

  function formatPeriodImpact(sub: SubscriptionItem) {
    if (sub.periodPriceImpact == null) return null
    const freq = subscriptionFrequencyLabel(sub.frequency)
    return t('dashboard.subscriptions.periodImpact', {
      amount: formatCurrency(sub.periodPriceImpact, sub.currency),
      period: freq
    })
  }

  function formatAnnualImpact(sub: SubscriptionItem) {
    if (sub.annualPriceImpact == null) return null
    return t('dashboard.subscriptions.annualImpact', {
      amount: formatCurrency(sub.annualPriceImpact, sub.currency)
    })
  }

  async function fetchCalendar(force = false) {
    if (calendar.value && !force) return calendar.value
    calendarPending.value = true
    try {
      await fx.ensureRates()
      calendar.value = await api<RenewalCalendarResponse>(apiRoutes.subscriptions.calendar)
      return calendar.value
    } finally {
      calendarPending.value = false
    }
  }

  async function dismissAlert(id: string) {
    actionPending.value = id
    try {
      const updated = await api<SubscriptionItem>(apiRoutes.subscriptions.dismiss(id), { method: 'POST' })
      const idx = subscriptions.value.findIndex(s => s.id === id)
      if (idx >= 0) subscriptions.value[idx] = updated
      appToast.success(t('dashboard.subscriptions.dismissed'))
    } finally {
      actionPending.value = null
    }
  }

  async function mergeDuplicates(id: string) {
    actionPending.value = id
    try {
      const updated = await api<SubscriptionItem>(apiRoutes.subscriptions.merge(id), { method: 'POST' })
      subscriptions.value = subscriptions.value.filter(s =>
        s.id === updated.id || s.name.toLowerCase() !== updated.name.toLowerCase()
      )
      const idx = subscriptions.value.findIndex(s => s.id === updated.id)
      if (idx >= 0) subscriptions.value[idx] = updated
      appToast.success(t('dashboard.subscriptions.merged'))
    } finally {
      actionPending.value = null
    }
  }

  async function patchSubscription(id: string, patch: SubscriptionPatchInput) {
    actionPending.value = id
    try {
      const updated = await api<SubscriptionItem>(apiRoutes.subscriptions.patch(id), {
        method: 'PATCH',
        body: patch
      })
      if (patch.hidden || patch.excluded) {
        subscriptions.value = subscriptions.value.filter(s => s.id !== id)
      } else {
        const idx = subscriptions.value.findIndex(s => s.id === id)
        if (idx >= 0) subscriptions.value[idx] = updated
      }
      appToast.success(t('dashboard.subscriptions.updated'))
      calendar.value = null
    } finally {
      actionPending.value = null
    }
  }

  return {
    subscriptions,
    statusFilter,
    actionPending,
    calendar,
    capStatus,
    calendarPending,
    loading,
    filterItems,
    monthlyTotal,
    activeCount,
    alertSubs,
    totalAnnualImpact,
    summaryItems,
    setFilter,
    fetchSubscriptions,
    fetchCalendar,
    dismissAlert,
    mergeDuplicates,
    patchSubscription,
    formatPeriodImpact,
    formatAnnualImpact,
    reset
  }
})
