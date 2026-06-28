import type { BusinessOverview } from '~/types/dashboard'
import { apiRoutes, useApi } from '~/lib/api'

export const useBusinessStore = defineStore('business', () => {
  const { t } = useAppI18n()
  const toast = useToast()
  const { api } = useApi()

  const tab = ref<'overview' | 'team'>('overview')
  const inviting = ref(false)
  const overview = ref<BusinessOverview | null>(null)
  const overviewPending = ref(false)

  const inviteForm = reactive({
    email: '',
    phone: '',
    role: 'GUEST' as 'FINANCE_ADMIN' | 'GUEST',
    displayName: ''
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

  const tabs = computed(() => [
    { label: t('dashboard.company.tabs.overview'), value: 'overview' },
    { label: t('dashboard.company.tabs.team'), value: 'team' }
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
          displayName: inviteForm.displayName.trim() || undefined
        }
      })
      inviteForm.email = ''
      inviteForm.phone = ''
      inviteForm.displayName = ''
      toast.add({
        title: t('dashboard.company.team.inviteSent'),
        color: 'success'
      })
      onSuccess?.()
      return true
    } catch {
      toast.add({
        title: t('dashboard.company.team.inviteFailed'),
        color: 'error'
      })
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
