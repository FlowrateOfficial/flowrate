// NOTE - ANCHOR: Accounts store — bank connect, sync, list
import type { DropdownMenuItem } from '@nuxt/ui'
import type { AccountSummary } from '~/types/financial'
import type { SummaryItem } from '~/components/dashboard/SummaryStrip.vue'
import { formatCurrencyForLocale } from '~/utils/format'
import { resolveErrorMessage } from '~/utils/errors'
import { loadStripe } from '~/lib/load-stripe'
import { isStripeConnectCancelled } from '~/lib/stripe-errors'
import { extractFcAccountIds } from '~/utils/stripe-fc'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useAccountsStore = defineStore('accounts', () => {
  const { t, getLocale } = useAppI18n()
  const spacesStore = useSpacesStore()
  const syncStore = useSyncStore()
  const { public: publicConfig } = useRuntimeConfig()
  const { api } = useApi()

  const accounts = ref<AccountSummary[]>([])
  const pending = ref(false)
  const visibilityFilter = ref<'all' | 'shared' | 'personal' | 'mine'>('all')
  const connectVisibility = ref<'PERSONAL' | 'SHARED'>('PERSONAL')
  const isConnecting = ref(false)
  const connectError = ref('')

  const visibilityItems = computed(() => [
    { label: t('dashboard.accounts.filterAll'), value: 'all' },
    { label: t('dashboard.accounts.filterShared'), value: 'shared' },
    { label: t('dashboard.accounts.filterPersonal'), value: 'personal' },
    { label: t('dashboard.accounts.filterMine'), value: 'mine' }
  ])

  const connectVisibilityItems = computed(() => [
    { label: t('dashboard.accounts.connectPersonal'), value: 'PERSONAL' },
    { label: t('dashboard.accounts.connectShared'), value: 'SHARED' }
  ])

  const totalBalance = computed(() =>
    accounts.value.reduce((sum, acc) => sum + acc.balance, 0)
  )

  const personalBalance = computed(() =>
    accounts.value.filter(a => a.visibility === 'PERSONAL').reduce((s, a) => s + a.balance, 0)
  )

  const sharedBalance = computed(() =>
    accounts.value.filter(a => a.visibility === 'SHARED').reduce((s, a) => s + a.balance, 0)
  )

  const summaryItems = computed<SummaryItem[]>(() => [
    {
      label: t('dashboard.accounts.totalBalance'),
      value: fmt(totalBalance.value, 'USD'),
      icon: 'i-lucide-wallet'
    },
    {
      label: t('dashboard.accounts.accountCount'),
      value: String(accounts.value.length),
      hint: t('dashboard.accounts.connected'),
      icon: 'i-lucide-landmark'
    },
    {
      label: t('dashboard.accounts.personalBalance'),
      value: fmt(personalBalance.value, 'USD'),
      icon: 'i-lucide-user'
    },
    {
      label: t('dashboard.accounts.sharedBalance'),
      value: fmt(sharedBalance.value, 'USD'),
      icon: 'i-lucide-users'
    }
  ])

  const stripeTestMode = computed(() => publicConfig.stripeConfigured && !publicConfig.stripeLiveMode)
  const isTeenView = computed(() => spacesStore.isTeenView)

  const teenSummaryItems = computed<SummaryItem[]>(() => [
    {
      label: t('dashboard.accounts.totalBalance'),
      value: fmt(totalBalance.value, 'USD'),
      icon: 'i-lucide-wallet'
    },
    {
      label: t('dashboard.accounts.accountCount'),
      value: String(accounts.value.length),
      hint: t('dashboard.accounts.connected'),
      icon: 'i-lucide-landmark'
    }
  ])

  const connectItems = computed((): DropdownMenuItem[][] => [
    [
      {
        label: t('dashboard.accounts.connectPersonal'),
        icon: 'i-lucide-user',
        onSelect: () => {
          connectVisibility.value = 'PERSONAL'
          connectBank()
        }
      },
      {
        label: t('dashboard.accounts.connectShared'),
        icon: 'i-lucide-users',
        onSelect: () => {
          connectVisibility.value = 'SHARED'
          connectBank()
        }
      }
    ]
  ])

  function fmt(balance: number, currency = 'USD') {
    return formatCurrencyForLocale(balance, getLocale(), currency)
  }

  async function fetchAccounts() {
    if (!spacesStore.activeSpace) return
    pending.value = true
    try {
      accounts.value = await api<AccountSummary[]>(apiRoutes.accounts.list, {
        query: visibilityFilter.value === 'all'
          ? {}
          : { visibility: visibilityFilter.value }
      })
    } finally {
      pending.value = false
    }
  }

  async function syncTransactions() {
    await syncStore.syncTransactions(fetchAccounts)
  }

  async function resyncFromStripe() {
    isConnecting.value = true
    connectError.value = ''
    try {
      await api(apiRoutes.stripe.syncAccounts, {
        method: 'POST',
        body: { syncAll: true, visibility: connectVisibility.value }
      })
      await fetchAccounts()
      if (!accounts.value.length) {
        connectError.value = t('dashboard.accounts.syncNoAccounts')
        return false
      }
      return true
    } catch (e) {
      connectError.value = resolveErrorMessage(e, t, 'dashboard.accounts.connectError')
      return false
    } finally {
      isConnecting.value = false
    }
  }

  async function connectBank() {
    if (isConnecting.value) return false

    isConnecting.value = true
    connectError.value = ''
    if (isTeenView.value) {
      connectVisibility.value = 'PERSONAL'
    }

    try {
      const stripe = await loadStripe()
      if (!stripe) {
        connectError.value = t('dashboard.accounts.stripeNotConfigured')
        return false
      }

      const { clientSecret, visibility } = await api<{ clientSecret: string, visibility: 'PERSONAL' | 'SHARED' }>(apiRoutes.stripe.connectBank, {
        method: 'POST',
        body: { visibility: connectVisibility.value }
      })

      const { financialConnectionsSession } = await stripe.collectFinancialConnectionsAccounts({ clientSecret })
      const accountIds = extractFcAccountIds(financialConnectionsSession)

      const result = await api<{ synced: Array<{ id: string, name: string, balance: number }> }>(apiRoutes.stripe.syncAccounts, {
        method: 'POST',
        body: {
          accountIds: accountIds.length ? accountIds : undefined,
          syncAll: accountIds.length === 0,
          visibility
        }
      })

      await fetchAccounts()

      if (!result.synced?.length && !accounts.value.length) {
        connectError.value = t('dashboard.accounts.syncNoAccounts')
        return false
      }

      if (result.synced?.length && !accounts.value.length) {
        // NOTE - Legacy accounts on wrong space — re-sync to attach to active space
        const retry = await api<{ synced: Array<{ id: string }> }>(apiRoutes.stripe.syncAccounts, {
          method: 'POST',
          body: { syncAll: true, visibility }
        })
        await fetchAccounts()
        if (retry.synced?.length && !accounts.value.length) {
          connectError.value = t('dashboard.accounts.syncNoAccounts')
          return false
        }
      }

      return true
    } catch (e) {
      if (isStripeConnectCancelled(e)) return true
      connectError.value = resolveErrorMessage(e, t, 'dashboard.accounts.connectError')
      return false
    } finally {
      isConnecting.value = false
    }
  }

  async function disconnectAccount(accountId: string) {
    await api(apiRoutes.accounts.delete(accountId), { method: 'DELETE' })
    await fetchAccounts()
  }

  watch(visibilityFilter, () => fetchAccounts())

  watch(() => spacesStore.activeSpace?.id, () => {
    visibilityFilter.value = 'all'
  })

  return {
    accounts,
    pending,
    visibilityFilter,
    connectVisibility,
    isConnecting,
    connectError,
    visibilityItems,
    connectVisibilityItems,
    summaryItems,
    stripeTestMode,
    isTeenView,
    teenSummaryItems,
    connectItems,
    isSharedSpace: computed(() => spacesStore.isSharedSpace),
    isSyncing: computed(() => syncStore.isSyncing),
    fmt,
    fetchAccounts,
    syncTransactions,
    resyncFromStripe,
    connectBank,
    disconnectAccount
  }
})
