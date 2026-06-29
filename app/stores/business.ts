import type { SummaryItem } from '~/components/dashboard/SummaryStrip.vue'
import type { BusinessOverview } from '~/types/dashboard'
import { planHasFeature } from '#shared/plan-limits'
import { useActivePlan } from '~/composables/useActivePlan'
import { createStoreFetch } from '~/utils/store-fetch'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

const fetchOnce = createStoreFetch()

export interface TeamMember {
  id: string
  email: string | null
  name: string | null
  role: string
  status: string
}

export const useBusinessStore = defineStore('business', () => {
  const { t, formatCurrency } = useAppI18n()
  const appToast = useAppToast()
  const { api } = useApi()
  const activePlan = useActivePlan()

  const tab = ref<'overview' | 'team'>('overview')
  const inviting = ref(false)
  const overview = ref<BusinessOverview | null>(null)
  const overviewPending = ref(false)
  const teamMembers = ref<TeamMember[]>([])
  const teamPending = ref(false)
  let lastOverviewId = ''
  let lastTeamId = ''

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

  function roleLabel(role: string) {
    const key = `roles.${role}`
    const translated = t(key)
    return translated !== key ? translated : role.toLowerCase().replaceAll('_', ' ')
  }

  function statusLabel(status: string) {
    const key = `memberStatus.${status}`
    const translated = t(key)
    return translated !== key ? translated : status
  }

  async function fetchOverview(spaceId: string, force = false) {
    return fetchOnce(`biz-overview:${spaceId}`, async () => {
      if (!force && lastOverviewId === spaceId && overview.value) return

      overviewPending.value = true
      try {
        overview.value = await api<BusinessOverview>(apiRoutes.spaces.businessOverview(spaceId))
        lastOverviewId = spaceId
      } finally {
        overviewPending.value = false
      }
    }, force)
  }

  async function fetchTeam(spaceId: string, force = false) {
    return fetchOnce(`biz-team:${spaceId}`, async () => {
      if (!force && lastTeamId === spaceId) return

      teamPending.value = true
      try {
        const data = await api<{ members: TeamMember[] }>(apiRoutes.spaces.detail(spaceId), {
          query: { view: 'team' }
        })
        teamMembers.value = data.members
        lastTeamId = spaceId
      } finally {
        teamPending.value = false
      }
    }, force)
  }

  async function inviteMember(spaceId: string, onSuccess?: () => void) {
    if (!inviteForm.phone.trim()) return false
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
      await fetchTeam(spaceId, true)
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
    overview.value = null
    teamMembers.value = []
    lastOverviewId = ''
    lastTeamId = ''
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
    statusLabel,
    fetchOverview,
    fetchTeam,
    inviteMember,
    reset
  }
})
