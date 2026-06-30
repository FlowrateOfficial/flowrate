// ANCHOR: User profile store — bootstrap and settings
import type { AppPlan } from '#shared/billing'
import type { AccountDeleteRequest } from '#shared/account-delete'
import { planHasFeature } from '#shared/plan-limits'
import { useActivePlan } from '~/composables/useActivePlan'
import type { UserProfile } from '~/types/user'
import { resolveErrorMessage } from '~/utils/errors'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useUserStore = defineStore('user', () => {
  const { t } = useAppI18n()
  const { getSession, signOut } = useNeonAuth()
  const spacesStore = useSpacesStore()
  const { api } = useApi()
  const activePlan = useActivePlan()

  const user = ref<{ id: string; name: string | null; email: string; phone?: string | null } | null>(null)
  const billing = ref<UserProfile['billing']>(null)
  const phoneVerified = ref(false)
  const plan = ref<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE')
  const isAdmin = ref(false)
  const loading = ref(false)
  const bootstrapped = ref(false)

  const profileForm = reactive({
    name: '',
    email: '',
    phone: ''
  })
  const verificationCode = ref('')
  const showVerificationInput = ref(false)
  const isSavingProfile = ref(false)
  const isVerifyingPhone = ref(false)
  const isResendingCode = ref(false)

  const navItems = computed(() => {
    if (spacesStore.isChildManaged) {
      return [{ label: t('nav.myMoney'), icon: 'i-lucide-piggy-bank', to: '/dashboard/teen' }]
    }

    if (spacesStore.isTeenView) {
      return [
        { label: t('nav.myMoney'), icon: 'i-lucide-piggy-bank', to: '/dashboard/teen' },
        { label: t('nav.accounts'), icon: 'i-lucide-landmark', to: '/dashboard/accounts' },
        { label: t('nav.transactions'), icon: 'i-lucide-arrow-left-right', to: '/dashboard/transactions' },
        { label: t('nav.analytics'), icon: 'i-lucide-bar-chart-3', to: '/dashboard/analytics' }
      ]
    }

    const items = []

    if (spacesStore.isCompany) {
      items.push({ label: t('nav.business'), icon: 'i-lucide-rocket', to: '/dashboard/company' })
    } else {
      items.push({ label: t('nav.overview'), icon: 'i-lucide-layout-dashboard', to: '/dashboard' })
    }

    items.push(
      { label: t('nav.analytics'), icon: 'i-lucide-bar-chart-3', to: '/dashboard/analytics' },
      { label: t('nav.transactions'), icon: 'i-lucide-arrow-left-right', to: '/dashboard/transactions' },
      { label: t('nav.accounts'), icon: 'i-lucide-landmark', to: '/dashboard/accounts' },
      {
        label: spacesStore.isCompany ? t('nav.saasVendors') : t('nav.subscriptions'),
        icon: 'i-lucide-shield-check',
        to: '/dashboard/subscriptions'
      },
      { label: t('nav.budgets'), icon: 'i-lucide-pie-chart', to: '/dashboard/budgets' }
    )

    if (spacesStore.isSharedSpace && (spacesStore.space?.type === 'HOUSEHOLD' || spacesStore.space?.type === 'FAMILY')) {
      items.push({ label: t('nav.family'), icon: 'i-lucide-users', to: '/dashboard/family' })
    }

    if (spacesStore.isCompany && spacesStore.canManageBusiness && planHasFeature(plan.value, 'companyTeam')) {
      items.push({ label: t('nav.businessTeam'), icon: 'i-lucide-users-round', to: '/dashboard/company?tab=team' })
    }

    if (!spacesStore.isCompany) {
      // NOTE - Overview already first for household spaces
    } else if (!items.some(i => i.to === '/dashboard')) {
      items.splice(1, 0, { label: t('nav.overview'), icon: 'i-lucide-layout-dashboard', to: '/dashboard' })
    }

    return items
  })

  const bottomItems = computed(() => {
    const items = [
      { label: t('common.settings'), icon: 'i-lucide-settings', to: '/dashboard/settings' }
    ]
    if (!spacesStore.isMinor) {
      items.unshift({ label: t('nav.spaces'), icon: 'i-lucide-layers', to: '/dashboard/spaces' })
    }
    if (isAdmin.value) {
      items.push({ label: t('nav.admin'), icon: 'i-lucide-shield-check', to: '/dashboard/admin/usage' })
    }
    return items
  })

  function isActive(to: string) {
    const path = useRouter().currentRoute.value.path
    if (to === '/dashboard') return path === '/dashboard'
    return path.startsWith(to)
  }

  async function deleteAccount(input: AccountDeleteRequest) {
    await api(apiRoutes.user.account, {
      method: 'DELETE',
      body: input,
      noSpace: true
    })
    await clearNuxtData('neon-auth-session')
    await signOut()
    resetSession()
    spacesStore.clearSession()
  }

  async function logout() {
    resetSession()
    spacesStore.clearSession()
    await clearNuxtData('neon-auth-session')
    await signOut()

    if (import.meta.client) {
      window.location.assign('/')
      return
    }

    await navigateTo('/', { replace: true })
  }

  function getAccountMenuLinks() {
    const items: Array<{ label: string, icon: string, to: string }> = []
    if (!spacesStore.isMinor) {
      items.push({ label: t('nav.spaces'), icon: 'i-lucide-layers', to: '/dashboard/spaces' })
    }
    items.push(
      { label: t('dashboard.feedback.title'), icon: 'i-lucide-message-square-heart', to: '/dashboard/feedback' },
      { label: t('common.settings'), icon: 'i-lucide-settings', to: '/dashboard/settings' },
      { label: t('common.privacy'), icon: 'i-lucide-shield', to: '/privacy' },
      { label: t('common.glba'), icon: 'i-lucide-landmark', to: '/glba' },
      { label: t('common.terms'), icon: 'i-lucide-file-text', to: '/terms' }
    )
    if (isAdmin.value) {
      items.splice(items.length - 4, 0, {
        label: t('nav.admin'),
        icon: 'i-lucide-shield-check',
        to: '/dashboard/admin/usage'
      })
    }
    return items
  }

  const accountMenuLinks = computed(getAccountMenuLinks)

  const userMenuItems = computed(() => [
    accountMenuLinks.value,
    [
      { label: t('common.signOut'), icon: 'i-lucide-log-out', onSelect: () => logout() }
    ]
  ])

  function applyProfile(profile: UserProfile) {
    user.value = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone
    }
    phoneVerified.value = profile.phoneVerified
    plan.value = profile.plan
    activePlan.value = profile.plan
    billing.value = profile.billing ?? null
    isAdmin.value = profile.isAdmin ?? false
  }

  function applySettingsForm(profile: UserProfile) {
    profileForm.name = profile.name ?? ''
    profileForm.email = profile.email
    profileForm.phone = profile.phone ?? ''
    phoneVerified.value = profile.phoneVerified
    showVerificationInput.value = Boolean(profile.phone && !profile.phoneVerified)
  }

  async function saveProfileForm() {
    isSavingProfile.value = true
    try {
      const data = await updateProfile({
        name: profileForm.name,
        phone: profileForm.phone.trim() || null
      })
      applySettingsForm(data)
      return data
    } finally {
      isSavingProfile.value = false
    }
  }

  function profileSaveErrorMessage(err: unknown) {
    const message = resolveErrorMessage(err, t, 'dashboard.settings.tryAgain')
    if (message.includes('already')) return t('dashboard.settings.phoneTaken')
    if (message.includes('E.164') || message.includes('valid')) return t('dashboard.settings.phoneInvalid')
    return message
  }

  async function verifyPhoneForm() {
    if (!verificationCode.value.trim()) return false
    isVerifyingPhone.value = true
    try {
      await verifyPhoneCode(verificationCode.value.trim())
      showVerificationInput.value = false
      verificationCode.value = ''
      return true
    } finally {
      isVerifyingPhone.value = false
    }
  }

  async function resendPhoneForm() {
    isResendingCode.value = true
    try {
      await resendPhoneCode()
      return true
    } finally {
      isResendingCode.value = false
    }
  }

  async function bootstrap() {
    if (bootstrapped.value) return
    await api(apiRoutes.user.bootstrap, { noSpace: true })
    bootstrapped.value = true
  }

  async function fetchProfile(options?: {
    syncBilling?: boolean
    checkoutSessionId?: string
  }): Promise<UserProfile | null> {
    let data = await api<UserProfile>(apiRoutes.user.profile, { noSpace: true }).catch(() => null)
    if (!data) return null

    const shouldSync = Boolean(options?.checkoutSessionId)
      || (options?.syncBilling && data.plan === 'FREE')

    if (shouldSync) {
      await api<{ plan: AppPlan }>(apiRoutes.stripe.syncSubscription, {
        method: 'POST',
        body: options?.checkoutSessionId ? { sessionId: options.checkoutSessionId } : {},
        noSpace: true
      }).catch(() => null)

      const refreshed = await api<UserProfile>(apiRoutes.user.profile, { noSpace: true }).catch(() => null)
      if (refreshed) data = refreshed
    }

    applyProfile(data)
    return data
  }

  function resetSession() {
    user.value = null
    billing.value = null
    plan.value = 'FREE'
    activePlan.value = 'FREE'
    isAdmin.value = false
    phoneVerified.value = false
    bootstrapped.value = false
  }

  async function fetchUser() {
    loading.value = true
    try {
      const session = await getSession()
      const profile = await fetchProfile()

      if (!profile && session?.user?.id) {
        user.value = {
          id: session.user.id,
          name: session.user.name ?? null,
          email: session.user.email ?? ''
        }
      } else if (!profile) {
        user.value = null
      }
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(body: { name: string, phone: string | null }) {
    const data = await api<UserProfile>(apiRoutes.user.profile, {
      method: 'PATCH',
      body,
      noSpace: true
    })
    applyProfile(data)
    return data
  }

  async function verifyPhoneCode(code: string) {
    await api(apiRoutes.user.phoneVerify, {
      method: 'POST',
      body: { code },
      noSpace: true
    })
    phoneVerified.value = true
  }

  async function resendPhoneCode() {
    await api(apiRoutes.user.phoneResend, { method: 'POST', noSpace: true })
  }

  async function syncSubscriptionPlan(): Promise<AppPlan | null> {
    const result = await api<{ plan: AppPlan }>(apiRoutes.stripe.syncSubscription, {
      method: 'POST',
      noSpace: true
    }).catch(() => null)
    if (result?.plan) {
      plan.value = result.plan
      activePlan.value = result.plan
      return result.plan
    }
    return null
  }

  return {
    user,
    billing,
    phoneVerified,
    plan,
    isAdmin,
    loading,
    profileForm,
    verificationCode,
    showVerificationInput,
    isSavingProfile,
    isVerifyingPhone,
    isResendingCode,
    navItems,
    bottomItems,
    accountMenuLinks,
    getAccountMenuLinks,
    userMenuItems,
    isActive,
    applyProfile,
    applySettingsForm,
    saveProfileForm,
    profileSaveErrorMessage,
    verifyPhoneForm,
    resendPhoneForm,
    bootstrap,
    bootstrapped,
    fetchProfile,
    fetchUser,
    updateProfile,
    verifyPhoneCode,
    resendPhoneCode,
    syncSubscriptionPlan,
    deleteAccount,
    logout
  }
})
