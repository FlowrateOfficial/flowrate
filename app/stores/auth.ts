import { createForgotPasswordSchema, createLoginSchema, createRegisterSchema } from '~/utils/schemas'
import { resolveErrorMessage } from '~/utils/errors'

export const useAuthStore = defineStore('auth', () => {
  const { t } = useAppI18n()
  const route = useRoute()
  const { signIn, signUp, requestPasswordReset } = useNeonAuth()

  const loginForm = reactive({ email: '', password: '' })
  const registerForm = reactive({ name: '', email: '', password: '', confirmPassword: '' })
  const forgotForm = reactive({ email: '' })

  const loading = ref(false)
  const error = ref('')
  const forgotSent = ref(false)

  const inviteInfo = ref<{ spaceName: string; role: string; email: string } | null>(null)

  const loginSchema = createLoginSchema()
  const forgotSchema = createForgotPasswordSchema()
  const registerSchema = computed(() => createRegisterSchema(t))

  function clearError() {
    error.value = ''
  }

  async function loadInvite(token: string) {
    try {
      const info = await $fetch<{ spaceName: string; role: string; email: string }>(`/api/invitations/${token}`)
      inviteInfo.value = info
      registerForm.email = info.email
    } catch {
      inviteInfo.value = null
    }
  }

  async function login() {
    loading.value = true
    error.value = ''
    try {
      const result = await signIn(loginForm.email, loginForm.password)
      if (result.error) {
        error.value = resolveErrorMessage(result.error, t, 'auth.login.errorInvalid')
        return false
      }
      await navigateTo('/dashboard')
      return true
    } catch (e) {
      error.value = resolveErrorMessage(e, t, 'auth.login.errorGeneric')
      return false
    } finally {
      loading.value = false
    }
  }

  async function register() {
    loading.value = true
    error.value = ''
    try {
      const result = await signUp(registerForm.email, registerForm.password, registerForm.name)
      if (result.error) {
        error.value = resolveErrorMessage(result.error, t, 'auth.register.errorGeneric')
        return false
      }

      if (route.query.plan === 'pro') {
        const billing = useBillingStore()
        await billing.startCheckout('pro')
        return true
      }

      await navigateTo('/dashboard/onboarding')
      return true
    } catch (e) {
      error.value = resolveErrorMessage(e, t, 'auth.register.errorGeneric')
      return false
    } finally {
      loading.value = false
    }
  }

  async function forgotPassword() {
    loading.value = true
    error.value = ''
    try {
      const result = await requestPasswordReset(forgotForm.email)
      if (result.error) {
        error.value = resolveErrorMessage(result.error, t, 'auth.forgot.errorGeneric')
        return false
      }
      forgotSent.value = true
      return true
    } catch (e) {
      error.value = resolveErrorMessage(e, t, 'auth.forgot.errorGeneric')
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loginForm,
    registerForm,
    forgotForm,
    loading,
    error,
    forgotSent,
    inviteInfo,
    loginSchema,
    forgotSchema,
    registerSchema,
    clearError,
    loadInvite,
    login,
    register,
    forgotPassword
  }
})
