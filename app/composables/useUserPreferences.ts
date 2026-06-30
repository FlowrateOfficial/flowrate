// ANCHOR: User notification preferences
import type { UserPreferences } from '#shared/user-preferences'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export function useUserPreferences() {
  const { api } = useApi()
  const appToast = useAppToast()
  const { t } = useAppI18n()

  const prefs = ref<UserPreferences | null>(null)
  const pending = ref(false)
  const saving = ref(false)

  async function load() {
    pending.value = true
    try {
      prefs.value = await api<UserPreferences>(apiRoutes.user.preferences)
    } finally {
      pending.value = false
    }
  }

  async function save(patch: UserPreferences) {
    saving.value = true
    try {
      prefs.value = await api<UserPreferences>(apiRoutes.user.preferences, {
        method: 'PATCH',
        body: patch
      })
      appToast.success(t('dashboard.settings.prefsSaved'))
    } finally {
      saving.value = false
    }
  }

  return { prefs, pending, saving, load, save }
}
