import { resolveErrorMessage } from '~/utils/errors'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useSyncStore = defineStore('sync', () => {
  const { t } = useAppI18n()
  const toast = useToast()
  const isSyncing = ref(false)
  const { api } = useApi()

  async function syncTransactions(refresh?: () => Promise<void>) {
    isSyncing.value = true
    try {
      const result = await api<{ imported: number, accounts: number }>(apiRoutes.stripe.syncTransactions, {
        method: 'POST'
      })
      if (refresh) await refresh()
      toast.add({
        title: t('dashboard.sync.complete'),
        description: t('dashboard.sync.imported', { count: result.imported, accounts: result.accounts }),
        color: result.imported > 0 ? 'success' : 'neutral'
      })
      return result
    } catch (e) {
      toast.add({
        title: t('dashboard.sync.failed'),
        description: resolveErrorMessage(e, t, 'dashboard.sync.tryAgain'),
        color: 'error'
      })
      throw e
    } finally {
      isSyncing.value = false
    }
  }

  return { isSyncing, syncTransactions }
})
