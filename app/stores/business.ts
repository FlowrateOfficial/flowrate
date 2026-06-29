import type { BusinessOverview } from '~/types/dashboard'
import { planHasFeature } from '#shared/plan-limits'
import { useActivePlan } from '~/composables/useActivePlan'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useBusinessStore = defineStore('business', () => {
  const { t } = useAppI18n()
  const appToast = useAppToast()
  const { api } = useApi()
  const activePlan = useActivePlan()

  const tab = ref<'overview' | 'team'>('overview')
  const inviting = ref(false)
  const overview = ref<BusinessOverview | null>(null)
  const overviewPending = ref(false)

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

  async function fetchOverview(spaceId: string) {
    overviewPending.value = true
    try {
      overview.value = await api<BusinessOverview>(apiRoutes.spaces.businessOverview(spaceId))
    } finally {
      overviewPending.value = false
    }
  }

  async function fetchSpaceDetail(spaceId: string) {
    return api<{
      members: Array<{
        id: string
        email: string | null
        name: string | null
        role: string
        status: string
      }>
    }>(apiRoutes.spaces.detail(spaceId))
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
      onSuccess?.()
      return true
    } catch {
      appToast.error(t('dashboard.company.team.inviteFailed'))
      return false
    } finally {
      inviting.value = false
    }
  }

  return {
    tab,
    inviting,
    overview,
    overviewPending,
    inviteForm,
    roleItems,
    tabs,
    roleLabel,
    statusLabel,
    fetchOverview,
    fetchSpaceDetail,
    inviteMember
  }
})
