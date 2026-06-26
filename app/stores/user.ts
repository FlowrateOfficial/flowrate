export const useUserStore = defineStore('user', () => {
  const { t } = useAppI18n()
  const { getSession, signOut } = useNeonAuth()
  const spacesStore = useSpacesStore()
  const route = useRoute()

  const user = ref<{ id: string; name: string | null; email: string } | null>(null)
  const plan = ref<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE')
  const loading = ref(false)

  const navItems = computed(() => {
    if (spacesStore.isTeenView) {
      return [{ label: t('nav.myMoney'), icon: 'i-lucide-piggy-bank', to: '/dashboard/teen' }]
    }

    const items = [
      { label: t('nav.overview'), icon: 'i-lucide-layout-dashboard', to: '/dashboard' },
      { label: t('nav.transactions'), icon: 'i-lucide-arrow-left-right', to: '/dashboard/transactions' },
      { label: t('nav.accounts'), icon: 'i-lucide-landmark', to: '/dashboard/accounts' },
      { label: t('nav.subscriptions'), icon: 'i-lucide-shield-check', to: '/dashboard/subscriptions' },
      { label: t('nav.budgets'), icon: 'i-lucide-pie-chart', to: '/dashboard/budgets' }
    ]

    if (spacesStore.isSharedSpace && (spacesStore.activeSpace?.type === 'HOUSEHOLD' || spacesStore.activeSpace?.type === 'FAMILY')) {
      items.push({ label: t('nav.family'), icon: 'i-lucide-users', to: '/dashboard/family' })
    }
    if (spacesStore.isCompany) {
      items.push({ label: t('nav.company'), icon: 'i-lucide-building-2', to: '/dashboard/company' })
    }

    return items
  })

  const bottomItems = computed(() => [
    { label: t('nav.spaces'), icon: 'i-lucide-layers', to: '/dashboard/spaces' },
    { label: t('common.settings'), icon: 'i-lucide-settings', to: '/dashboard/settings' }
  ])

  function isActive(to: string) {
    if (to === '/dashboard') return route.path === '/dashboard'
    return route.path.startsWith(to)
  }

  async function logout() {
    await signOut()
    user.value = null
    plan.value = 'FREE'
    spacesStore.clearSession()
    if (import.meta.client) {
      localStorage.removeItem('flowrate-active-space')
    }
    await navigateTo('/', { replace: true })
  }

  const userMenuItems = computed(() => [[
    { label: t('common.settings'), icon: 'i-lucide-settings', to: '/dashboard/settings' },
    { label: t('common.signOut'), icon: 'i-lucide-log-out', click: logout }
  ]])

  async function fetchUser() {
    loading.value = true
    try {
      const session = await getSession()
      user.value = session?.user ?? null
      const api = useApiFetch()
      const profile = await api<{ plan: 'FREE' | 'PRO' | 'ENTERPRISE' }>('/api/user/profile').catch(() => null)
      if (profile?.plan) plan.value = profile.plan
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    plan,
    loading,
    navItems,
    bottomItems,
    userMenuItems,
    isActive,
    fetchUser,
    logout
  }
})
