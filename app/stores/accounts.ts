// ANCHOR: Accounts store — connect banks, sync, list
import type { DropdownMenuItem } from '@nuxt/ui'
import type { AccountSummary } from '~/types/financial'
import type { SummaryItem } from '~/components/dashboard/SummaryStrip.vue'
import { resolveErrorMessage } from '~/utils/errors'
import { createSpaceScopedLoader } from '~/utils/store-fetch'
import { loadStripe } from '~/lib/load-stripe'
import { isStripeConnectCancelled } from '~/lib/stripe-errors'
import { extractFcAccountIds } from '~/utils/stripe-fc'
import { isPlaidConnectCancelled, openPlaidLink, resolvePlaidLinkErrorMessage, storePlaidLinkSession } from '~/lib/plaid-link'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useAccountsStore = defineStore('accounts', () => {
  const { t, formatCurrency, resolveCurrency } = useAppI18n()
  const spacesStore = useSpacesStore()
  const syncStore = useSyncStore()
  const { public: publicConfig } = useRuntimeConfig()
  const appToast = useAppToast()
  const { api } = useApi()

  const accounts = ref<AccountSummary[]>([])
  const visibilityFilter = ref<'all' | 'shared' | 'personal' | 'mine'>('all')
  const connectVisibility = ref<'PERSONAL' | 'SHARED'>('PERSONAL')
  const isConnecting = ref(false)

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

  const spaceCurrency = computed(() => resolveCurrency(accounts.value))

  const summaryItems = computed<SummaryItem[]>(() => [
    {
      label: t('dashboard.accounts.totalBalance'),
      value: fmt(totalBalance.value),
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
      value: fmt(personalBalance.value),
      icon: 'i-lucide-user'
    },
    {
      label: t('dashboard.accounts.sharedBalance'),
      value: fmt(sharedBalance.value),
      icon: 'i-lucide-users'
    }
  ])

  const stripeTestMode = computed(() => publicConfig.stripeConfigured && !publicConfig.stripeLiveMode)
  const plaidConfigured = computed(() => publicConfig.plaidConfigured)
  const plaidSandboxMode = computed(() => publicConfig.plaidConfigured && publicConfig.plaidSandboxMode)
  const isTeenView = computed(() => spacesStore.isTeenView)

  const teenSummaryItems = computed<SummaryItem[]>(() => [
    {
      label: t('dashboard.accounts.totalBalance'),
      value: fmt(totalBalance.value),
      icon: 'i-lucide-wallet'
    },
    {
      label: t('dashboard.accounts.accountCount'),
      value: String(accounts.value.length),
      hint: t('dashboard.accounts.connected'),
      icon: 'i-lucide-landmark'
    }
  ])

  const connectItems = computed((): DropdownMenuItem[][] => {
    const items: DropdownMenuItem[] = []

    if (plaidConfigured.value) {
      items.push({
        label: t('dashboard.accounts.connectEuropean'),
        icon: 'i-lucide-globe',
        onSelect: () => {
          connectVisibility.value = 'PERSONAL'
          connectPlaidBank()
        }
      })
      if (!isTeenView.value) {
        items.push({
          label: t('dashboard.accounts.connectEuropeanShared'),
          icon: 'i-lucide-globe',
          onSelect: () => {
            connectVisibility.value = 'SHARED'
            connectPlaidBank()
          }
        })
      }
    }

    if (publicConfig.stripeConfigured) {
      items.push({
        label: t('dashboard.accounts.connectUs'),
        icon: 'i-lucide-flag',
        onSelect: () => {
          connectVisibility.value = 'PERSONAL'
          connectStripeBank()
        }
      })
      if (!isTeenView.value) {
        items.push({
          label: t('dashboard.accounts.connectUsShared'),
          icon: 'i-lucide-flag',
          onSelect: () => {
            connectVisibility.value = 'SHARED'
            connectStripeBank()
          }
        })
      }
    }

    return items.length ? [items] : []
  })

  function fmt(balance: number, currency?: string) {
    return formatCurrency(balance, currency ?? spaceCurrency.value)
  }

  const { pending, load: fetchAccounts, reset: resetLoader, seed } = createSpaceScopedLoader({
    // NOTE - Filter is part of cache key; watch refetches on change
    buildKey: spaceId => `accounts:${spaceId}:${visibilityFilter.value}`,
    fetch: async () => api<AccountSummary[]>(apiRoutes.accounts.list, {
      query: visibilityFilter.value === 'all'
        ? {}
        : { visibility: visibilityFilter.value }
    }),
    apply: data => { accounts.value = data },
    clear: () => { accounts.value = [] },
    isCached: () => accounts.value.length > 0
  })

  async function syncTransactions() {
    await syncStore.syncTransactions(fetchAccounts)
  }

  async function resyncFromStripe() {
    isConnecting.value = true
    try {
      await api(apiRoutes.stripe.syncAccounts, {
        method: 'POST',
        body: { syncAll: true, visibility: connectVisibility.value }
      })
      await fetchAccounts()
      if (!accounts.value.length) {
        appToast.warning(t('dashboard.accounts.syncNoAccounts'))
        return false
      }
      return true
    } catch (e) {
      appToast.errorFrom(e, 'dashboard.accounts.connectError')
      return false
    } finally {
      isConnecting.value = false
    }
  }

  async function connectStripeBank() {
    if (isConnecting.value) return false

    isConnecting.value = true
    if (isTeenView.value) {
      connectVisibility.value = 'PERSONAL'
    }

    try {
      const stripe = await loadStripe()
      if (!stripe) {
        appToast.errorMessage(t('dashboard.accounts.stripeNotConfigured'))
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
        appToast.warning(t('dashboard.accounts.syncNoAccounts'))
        return false
      }

      if (result.synced?.length && !accounts.value.length) {
        const retry = await api<{ synced: Array<{ id: string }> }>(apiRoutes.stripe.syncAccounts, {
          method: 'POST',
          body: { syncAll: true, visibility }
        })
        await fetchAccounts()
        if (retry.synced?.length && !accounts.value.length) {
          appToast.warning(t('dashboard.accounts.syncNoAccounts'))
          return false
        }
      }

      return true
    } catch (e) {
      if (isStripeConnectCancelled(e)) return true
      appToast.errorFrom(e, 'dashboard.accounts.connectError')
      return false
    } finally {
      isConnecting.value = false
    }
  }

  async function connectPlaidBank() {
    if (isConnecting.value) return false

    isConnecting.value = true
    if (isTeenView.value) {
      connectVisibility.value = 'PERSONAL'
    }

    try {
      if (!plaidConfigured.value) {
        appToast.errorMessage(t('dashboard.accounts.plaidNotConfigured'))
        return false
      }

      const { linkToken, visibility } = await api<{
        linkToken: string
        visibility?: 'PERSONAL' | 'SHARED'
      }>(apiRoutes.plaid.linkToken, {
        method: 'POST',
        body: { visibility: connectVisibility.value }
      })

      const visibilityValue = visibility ?? connectVisibility.value
      storePlaidLinkSession(linkToken, visibilityValue)

      const { publicToken, metadata } = await openPlaidLink({ linkToken })

      const result = await api<{ synced: Array<{ id: string, name: string, balance: number }> }>(apiRoutes.plaid.exchange, {
        method: 'POST',
        body: {
          publicToken,
          visibility: visibilityValue,
          metadata
        }
      })

      await fetchAccounts()

      if (!result.synced?.length && !accounts.value.length) {
        appToast.warning(t('dashboard.accounts.syncNoAccounts'))
        return false
      }

      return true
    } catch (e) {
      if (isPlaidConnectCancelled(e)) return true
      const plaidMessage = resolvePlaidLinkErrorMessage(e)
      if (e instanceof Error && e.message === 'Failed to load Plaid Link') {
        appToast.errorMessage(t('dashboard.accounts.plaidLinkLoadError'))
        return false
      }
      appToast.errorMessage(plaidMessage ?? resolveErrorMessage(e, t, 'dashboard.accounts.connectError'))
      return false
    } finally {
      isConnecting.value = false
    }
  }

  async function connectBank() {
    if (plaidConfigured.value && !publicConfig.stripeConfigured) {
      return connectPlaidBank()
    }
    if (publicConfig.stripeConfigured && !plaidConfigured.value) {
      return connectStripeBank()
    }
    if (plaidConfigured.value) {
      return connectPlaidBank()
    }
    return connectStripeBank()
  }

  async function disconnectAccount(accountId: string) {
    await api(apiRoutes.accounts.delete(accountId), { method: 'DELETE' })
    await fetchAccounts()
  }

  function reset() {
    resetLoader()
    visibilityFilter.value = 'all'
  }

  function seedAccounts(rows: AccountSummary[]) {
    const spaceId = spacesStore.space?.id
    if (spaceId) {
      // NOTE - Mark cached as "all" filter so visibility changes still refetch
      seed(rows, `accounts:${spaceId}:all`)
    } else {
      accounts.value = rows
    }
  }

  watch(visibilityFilter, () => fetchAccounts(true))

  return {
    accounts,
    pending,
    visibilityFilter,
    connectVisibility,
    isConnecting,
    visibilityItems,
    connectVisibilityItems,
    summaryItems,
    stripeTestMode,
    plaidConfigured,
    plaidSandboxMode,
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
    connectStripeBank,
    connectPlaidBank,
    disconnectAccount,
    reset,
    seedAccounts
  }
})
