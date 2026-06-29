import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useSyncStore = defineStore('sync', () => {
  const { t } = useAppI18n()
  const appToast = useAppToast()
  const isSyncing = ref(false)
  const { api } = useApi()

  async function syncTransactions(refresh?: () => Promise<void>) {
    isSyncing.value = true
    try {
      const result = await api<{ imported: number, accounts: number }>(apiRoutes.stripe.syncTransactions, {
        method: 'POST'
      })
      if (refresh) await refresh()
      if (result.imported > 0) {
        appToast.success(
          t('dashboard.sync.complete'),
          t('dashboard.sync.imported', { count: result.imported, accounts: result.accounts })
        )
      } else {
        appToast.neutral(
          t('dashboard.sync.complete'),
          t('dashboard.sync.imported', { count: result.imported, accounts: result.accounts })
        )
      }
      return result
    } catch (e) {
      appToast.errorFrom(e, 'dashboard.sync.tryAgain', t('dashboard.sync.failed'))
      throw e
    } finally {
      isSyncing.value = false
    }
  }

  return { isSyncing, syncTransactions }
})
