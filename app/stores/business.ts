// ANCHOR: Company store — burn rate overview + team invites
import type { SummaryItem } from '~/components/dashboard/SummaryStrip.vue'
import type { TeamMember } from '~/types/business'
import type { BusinessOverview } from '~/types/dashboard'
import { planHasFeature } from '#shared/plan-limits'
import { useActivePlan } from '~/composables/useActivePlan'
import { createSpaceScopedLoader } from '~/utils/store-fetch'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export type { TeamMember }

export const useBusinessStore = defineStore('business', () => {
  const { t, formatCurrency, roleLabel, memberStatusLabel } = useAppI18n()
  const appToast = useAppToast()
  const { api } = useApi()
  const activePlan = useActivePlan()

  const tab = ref<'overview' | 'team'>('overview')
  const inviting = ref(false)
  const overview = ref<BusinessOverview | null>(null)
  const teamMembers = ref<TeamMember[]>([])

  const inviteForm = reactive({
    email: '',
    phone: '',
    role: 'GUEST' as 'FINANCE_ADMIN' | 'GUEST',
    name: ''
  })

  const roleItems = computed(() => [
    {
      label: t('dashboard.company.team.roles.financeAdmin'),
      value: 'FINANCE_ADMIN' as const,
      description: t('dashboard.company.team.roles.financeAdminDesc')
    },
    {
      label: t('dashboard.company.team.roles.guest'),
      value: 'GUEST' as const,
      description: t('dashboard.company.team.roles.guestDesc')
    }
  ])

  const tabs = computed(() => {
    const items: Array<{ label: string, value: 'overview' | 'team' }> = [
      { label: t('dashboard.company.tabs.overview'), value: 'overview' }
    ]

    if (planHasFeature(activePlan.value, 'companyTeam')) {
      items.push({ label: t('dashboard.company.tabs.team'), value: 'team' })
    }

    return items
  })

  watch(tabs, (items) => {
    // NOTE - Hide team tab when plan drops companyTeam feature
    if (tab.value === 'team' && !items.some(item => item.value === 'team')) {
      tab.value = 'overview'
    }
  })

  function fmt(n: number) {
    return formatCurrency(n)
  }

  function runwayLabel(months: number | null | undefined) {
    if (months == null || months > 99) return t('dashboard.company.stats.infinite')
    return t('dashboard.company.stats.months', { count: months })
  }

  function alertMessage(alert: BusinessOverview['alerts'][number]) {
    const key = `dashboard.company.alerts.${alert.code}`
    const params = alert.params
      ? Object.fromEntries(Object.entries(alert.params).map(([k, v]) => [k, String(v)]))
      : undefined
    return t(key, params)
  }

  const setupSteps = computed(() => [
    {
      done: overview.value?.setup.hasAccounts,
      title: t('dashboard.company.setup.step1Title'),
      description: t('dashboard.company.setup.step1Desc'),
      to: '/dashboard/accounts',
      cta: t('dashboard.company.setup.step1Cta')
    },
    {
      done: overview.value?.setup.hasTransactions,
      title: t('dashboard.company.setup.step2Title'),
      description: t('dashboard.company.setup.step2Desc'),
      to: '/dashboard/transactions',
      cta: t('dashboard.company.setup.step2Cta')
    },
    {
      done: overview.value?.setup.complete,
      title: t('dashboard.company.setup.step3Title'),
      description: t('dashboard.company.setup.step3Desc'),
      to: '/dashboard/subscriptions',
      cta: t('dashboard.company.setup.step3Cta')
    }
  ])

  const { pending: overviewPending, load: fetchOverview, reset: resetOverview } = createSpaceScopedLoader({
    buildKey: spaceId => `biz-overview:${spaceId}`,
    fetch: async (spaceId) => api<BusinessOverview>(apiRoutes.spaces.businessOverview(spaceId)),
    apply: data => { overview.value = data },
    clear: () => { overview.value = null },
    isCached: () => overview.value != null
  })

  const { pending: teamPending, load: fetchTeam, reset: resetTeam } = createSpaceScopedLoader({
    buildKey: spaceId => `biz-team:${spaceId}`,
    fetch: async (spaceId) => api<{ members: TeamMember[] }>(apiRoutes.spaces.detail(spaceId), {
      query: { view: 'team' }
    }),
    apply: data => { teamMembers.value = data.members },
    clear: () => { teamMembers.value = [] },
    isCached: () => teamMembers.value.length > 0
  })

  async function inviteMember(onSuccess?: () => void) {
    const spaceId = useSpacesStore().space?.id
    if (!spaceId || !inviteForm.phone.trim()) return false
    inviting.value = true
    try {
      await api(apiRoutes.spaces.members(spaceId), {
        method: 'POST',
        body: {
          phone: inviteForm.phone.trim(),
          email: inviteForm.email.trim() || undefined,
          role: inviteForm.role,
          name: inviteForm.name.trim() || undefined
        }
      })
      inviteForm.email = ''
      inviteForm.phone = ''
      inviteForm.name = ''
      appToast.success(t('dashboard.company.team.inviteSent'))
      await fetchTeam(true)
      onSuccess?.()
      return true
    } catch {
      appToast.error(t('dashboard.company.team.inviteFailed'))
      return false
    } finally {
      inviting.value = false
    }
  }

  function reset() {
    resetOverview()
    resetTeam()
  }

  return {
    tab,
    inviting,
    overview,
    overviewPending,
    teamMembers,
    teamPending,
    inviteForm,
    roleItems,
    tabs,
    setupSteps,
    fmt,
    runwayLabel,
    alertMessage,
    roleLabel,
    statusLabel: memberStatusLabel,
    fetchOverview,
    fetchTeam,
    inviteMember,
    reset
  }
})
