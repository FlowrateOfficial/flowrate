// ANCHOR: Account deletion flow
import type { AccountDeleteChallenge, AccountDeleteRequest } from '#shared/account-delete'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export function useAccountDelete() {
  const { t } = useAppI18n()
  const appToast = useAppToast()
  const userStore = useUserStore()
  const { api } = useApi()

  const open = ref(false)
  const confirmEmail = ref('')
  const confirmPassword = ref('')
  const emailCode = ref('')
  const phoneCode = ref('')
  const acknowledged = ref(false)
  const codesSent = ref(false)
  const isDeleting = ref(false)
  const isSendingCodes = ref(false)
  const isLoadingChallenge = ref(false)
  const challenge = ref<AccountDeleteChallenge | null>(null)

  const canConfirm = computed(() => {
    if (!acknowledged.value || !confirmEmail.value.trim() || !codesSent.value) return false
    if (!emailCode.value.trim()) return false
    if (challenge.value?.hasVerifiedPhone && !phoneCode.value.trim()) return false
    if (challenge.value?.requiresPassword && !confirmPassword.value.trim()) return false
    return true
  })

  function resetForm() {
    confirmEmail.value = ''
    confirmPassword.value = ''
    emailCode.value = ''
    phoneCode.value = ''
    acknowledged.value = false
    codesSent.value = false
    challenge.value = null
  }

  async function loadChallenge() {
    isLoadingChallenge.value = true
    try {
      challenge.value = await api<AccountDeleteChallenge>(apiRoutes.user.deleteChallenge, { noSpace: true })
    } finally {
      isLoadingChallenge.value = false
    }
  }

  function openModal(email: string) {
    resetForm()
    confirmEmail.value = email
    open.value = true
    void loadChallenge()
  }

  async function sendVerificationCodes() {
    isSendingCodes.value = true
    try {
      await api(apiRoutes.user.deleteChallenge, { method: 'POST', noSpace: true })
      codesSent.value = true
      appToast.success(t('dashboard.settings.deleteCodesSent'))
    } catch (error) {
      appToast.errorFrom(error, 'dashboard.settings.deleteCodesFailed')
      throw error
    } finally {
      isSendingCodes.value = false
    }
  }

  async function confirmDelete(): Promise<boolean> {
    if (!canConfirm.value) return false

    isDeleting.value = true
    try {
      const payload: AccountDeleteRequest = {
        confirmEmail: confirmEmail.value.trim(),
        emailCode: emailCode.value.trim(),
        phoneCode: phoneCode.value.trim() || undefined,
        password: confirmPassword.value.trim() || undefined
      }
      await userStore.deleteAccount(payload)
      open.value = false
      return true
    } finally {
      isDeleting.value = false
    }
  }

  return {
    open,
    confirmEmail,
    confirmPassword,
    emailCode,
    phoneCode,
    acknowledged,
    codesSent,
    isDeleting,
    isSendingCodes,
    isLoadingChallenge,
    challenge,
    canConfirm,
    openModal,
    sendVerificationCodes,
    confirmDelete
  }
}
