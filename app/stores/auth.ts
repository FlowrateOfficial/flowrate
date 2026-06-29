import { createForgotPasswordSchema, createLoginSchema, createRegisterSchema } from '~/utils/schemas'
import { resolveErrorMessage } from '~/utils/errors'

export const useAuthStore = defineStore('auth', () => {
  const { t } = useAppI18n()
  const route = useRoute()
  const appToast = useAppToast()
  const { signIn, signUp, requestPasswordReset } = useNeonAuth()

  const loginForm = reactive({ email: '', password: '' })
  const registerForm = reactive({ name: '', email: '', password: '', confirmPassword: '', agreedToTerms: false })
  const forgotForm = reactive({ email: '' })

  const loading = ref(false)
  const forgotSent = ref(false)

  const inviteInfo = ref<{ spaceName: string; role: string; email: string } | null>(null)
  const selectedPlan = ref<'free' | 'pro' | 'enterprise'>('free')

  const loginSchema = createLoginSchema()
  const forgotSchema = createForgotPasswordSchema()
  const registerSchema = computed(() => createRegisterSchema(t))

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
    try {
      const result = await signIn(loginForm.email, loginForm.password)
      if (result.error) {
        appToast.errorMessage(resolveErrorMessage(result.error, t, 'auth.login.errorInvalid'))
        return
      }
      await navigateTo('/dashboard')
    } catch (e) {
      appToast.errorFrom(e, 'auth.login.errorGeneric')
    } finally {
      loading.value = false
    }
  }

  async function register() {
    loading.value = true
    try {
      const result = await signUp(registerForm.email, registerForm.password, registerForm.name)
      if (result.error) {
        appToast.errorFrom(result.error, 'auth.register.errorGeneric')
        return
      }

      const billingStore = useBillingStore()
      const plan = (route.query.plan as string) || selectedPlan.value
      const billing = billingStore.pricingCadence === 'yearly' ? 'year' : 'month'

      if (plan === 'pro' || plan === 'enterprise') {
        if (!billingStore.plans.length) {
          await billingStore.fetchPlans()
        }
        await billingStore.startCheckout(plan, billing)
        return
      }

      await navigateTo('/dashboard/onboarding')
    } catch (e) {
      appToast.errorFrom(e, 'auth.register.errorGeneric')
    } finally {
      loading.value = false
    }
  }

  async function forgotPassword() {
    loading.value = true
    try {
      const result = await requestPasswordReset(forgotForm.email)
      if (result.error) {
        appToast.errorFrom(result.error, 'auth.forgot.errorGeneric')
        return
      }
      forgotSent.value = true
      appToast.success(
        t('auth.forgot.checkEmailTitle'),
        t('auth.forgot.checkEmailDescription')
      )
    } catch (e) {
      appToast.errorFrom(e, 'auth.forgot.errorGeneric')
    } finally {
      loading.value = false
    }
  }

  return {
    loginForm,
    registerForm,
    forgotForm,
    loading,
    forgotSent,
    inviteInfo,
    selectedPlan,
    loginSchema,
    forgotSchema,
    registerSchema,
    loadInvite,
    login,
    register,
    forgotPassword
  }
})
