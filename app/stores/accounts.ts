import { formatCurrencyForLocale } from '~/utils/format'
import { resolveErrorMessage } from '~/utils/errors'
import { loadStripe } from '~/lib/load-stripe'
import { isStripeConnectCancelled } from '~/lib/stripe-errors'

export const useAccountsStore = defineStore('accounts', () => {
  const { t, getLocale } = useAppI18n()
  const spacesStore = useSpacesStore()

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

  function fmt(balance: number, currency = 'USD') {
    return formatCurrencyForLocale(balance, getLocale(), currency)
  }

  async function connectBank(refresh: () => Promise<void>) {
    isConnecting.value = true
    connectError.value = ''
    const api = useApiFetch()

    try {
      const stripe = await loadStripe()
      if (!stripe) {
        connectError.value = t('dashboard.accounts.stripeNotConfigured')
        return false
      }

      const { clientSecret, visibility } = await api<{ clientSecret: string, visibility: 'PERSONAL' | 'SHARED' }>('/api/stripe/connect-bank', {
        method: 'POST',
        body: { visibility: connectVisibility.value },
        headers: spacesStore.spaceHeaders()
      })

      const { financialConnectionsSession } = await stripe.collectFinancialConnectionsAccounts({ clientSecret })
      const accountIds = financialConnectionsSession?.accounts?.map(account => account.id) ?? []

      if (!accountIds.length) return true

      await api('/api/stripe/sync-accounts', {
        method: 'POST',
        body: { accountIds, visibility },
        headers: spacesStore.spaceHeaders()
      })

      await refresh()
      return true
    } catch (e) {
      if (isStripeConnectCancelled(e)) return true
      connectError.value = resolveErrorMessage(e, t, 'dashboard.accounts.connectError')
      return false
    } finally {
      isConnecting.value = false
    }
  }

  return {
    visibilityFilter,
    connectVisibility,
    isConnecting,
    connectError,
    visibilityItems,
    connectVisibilityItems,
    isSharedSpace: computed(() => spacesStore.isSharedSpace),
    fmt,
    connectBank
  }
})
