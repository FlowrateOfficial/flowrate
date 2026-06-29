import type { TableColumn } from '@nuxt/ui'
import type { TransactionRow } from '~/types/financial'
import { planHasFeature } from '#shared/plan-limits'
import { useActivePlan } from '~/composables/useActivePlan'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export interface SpaceDetailMember {
  id: string
  userId: string | null
  email: string | null
  name: string | null
  role: string
  status: string
  birthday: string | null
  childProfile: {
    id: string
    allowance: number | null
    frequency: string | null
    learnMode: boolean
    jars: Array<{ id: string, name: string, balance: number, target: number | null }>
  } | null
  financialSummary: { balance: number, spending30d: number, accountCount: number } | null
}

export interface SpaceDetail {
  id: string
  name: string
  type: string
  role: string
  settings: unknown
  members: SpaceDetailMember[]
  accounts: unknown[]
}

export interface MemberFinancial {
  member: {
    id: string
    userId?: string | null
    name: string | null
    email: string | null
    role: string
    status: string
    birthday: string | null
    hasAccount: boolean
    childProfile?: {
      allowance: number | null
      frequency: string | null
      learnMode: boolean
      jars: Array<{ id: string, name: string, balance: number, target: number | null }>
    } | null
  }
  accounts: Array<{
    id: string
    name: string
    institution: string | null
    type: string
    visibility: string
    balance: number
    currency: string
    syncedAt: string | null
  }>
  transactions: TransactionRow[]
  stats: {
    balance: number
    spending30d: number
    income30d: number
    transactionCount: number
  }
}

export const useFamilyStore = defineStore('family', () => {
  const { t, categoryLabel, intlLocale, formatCurrency } = useAppI18n()
  const spacesStore = useSpacesStore()
  const appToast = useAppToast()
  const { api } = useApi()
  const activePlan = useActivePlan()

  const inviting = ref(false)
  const saving = ref(false)
  const tab = ref('members')
  const memberTab = ref('overview')

  const inviteForm = reactive({ email: '', role: 'CO_GUARDIAN', name: '' })
  const childForm = reactive({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CHILD' as 'CHILD' | 'TEEN',
    birthday: ''
  })
  const allowanceForm = reactive({
    allowance: 0,
    frequency: 'WEEKLY' as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    learnMode: true
  })
  const jarName = ref('')

  const tabs = computed(() => {
    const items = [
      { label: t('dashboard.family.tabs.members'), value: 'members' }
    ]

    if (planHasFeature(activePlan.value, 'teenAccounts')) {
      items.push({ label: t('dashboard.family.tabs.children'), value: 'children' })
    }

    items.push({ label: t('dashboard.family.tabs.splits'), value: 'splits' })
    return items
  })

  watch(tabs, (items) => {
    if (tab.value === 'children' && !items.some(item => item.value === 'children')) {
      tab.value = 'members'
    }
  })

  const childRoleItems = computed(() => [
    { label: t('dashboard.family.roleChild'), value: 'CHILD' },
    { label: t('dashboard.family.roleTeen'), value: 'TEEN' }
  ])

  const frequencyItems = computed(() => [
    { label: t('frequencies.WEEKLY'), value: 'WEEKLY' },
    { label: t('frequencies.MONTHLY'), value: 'MONTHLY' },
    { label: t('frequencies.YEARLY'), value: 'YEARLY' }
  ])

  const categoryItems = computed(() =>
    ['FOOD', 'HOUSING', 'UTILITIES', 'ENTERTAINMENT', 'OTHER'].map(c => ({
      label: categoryLabel(c),
      value: c
    }))
  )

  const memberTabs = computed(() => [
    { label: t('dashboard.family.memberTabs.overview'), value: 'overview' },
    { label: t('dashboard.family.memberTabs.accounts'), value: 'accounts' },
    { label: t('dashboard.family.memberTabs.transactions'), value: 'transactions' },
    { label: t('dashboard.family.memberTabs.allowance'), value: 'allowance' }
  ])

  function fmt(amount: number, currency?: string) {
    return formatCurrency(amount, currency)
  }

  function roleLabel(role: string) {
    const key = `roles.${role}`
    const translated = t(key)
    return translated !== key ? translated : role.toLowerCase().replace('_', ' ')
  }

  function statusLabel(status: string) {
    const key = `memberStatus.${status}`
    const translated = t(key)
    return translated !== key ? translated : status
  }

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat(intlLocale.value, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateStr))
  }

  function transactionColumns(): TableColumn<TransactionRow>[] {
    return [
      { accessorKey: 'date', header: t('dashboard.transactions.columns.date') },
      { accessorKey: 'description', header: t('dashboard.transactions.columns.description') },
      { accessorKey: 'category', header: t('dashboard.transactions.columns.category') },
      {
        accessorKey: 'amount',
        header: t('dashboard.transactions.columns.amount'),
        meta: { class: { th: 'text-right', td: 'text-right' } }
      }
    ]
  }

  async function fetchSpaceDetail(spaceId: string) {
    return api<SpaceDetail>(apiRoutes.spaces.detail(spaceId))
  }

  async function fetchMemberFinancial(spaceId: string, memberId: string) {
    return api<MemberFinancial>(apiRoutes.spaces.memberFinancial(spaceId, memberId))
  }

  async function inviteMember(spaceId: string, refresh: () => Promise<void>) {
    inviting.value = true
    try {
      await api(apiRoutes.spaces.members(spaceId), {
        method: 'POST',
        body: {
          email: inviteForm.email,
          role: inviteForm.role,
          name: inviteForm.name || undefined
        }
      })
      inviteForm.email = ''
      inviteForm.name = ''
      await refresh()
    } finally {
      inviting.value = false
    }
  }

  async function addChild(spaceId: string, refresh: () => Promise<void>) {
    if (!childForm.username.trim() || !childForm.email.trim() || !childForm.password) {
      appToast.errorMessage(t('dashboard.family.childErrors.missingFields'))
      return false
    }
    if (childForm.password !== childForm.confirmPassword) {
      appToast.errorMessage(t('dashboard.family.childErrors.passwordMismatch'))
      return false
    }
    if (childForm.password.length < 8) {
      appToast.errorMessage(t('dashboard.family.childErrors.passwordTooShort'))
      return false
    }

    inviting.value = true
    const createdName = childForm.username.trim()
    try {
      await api(apiRoutes.spaces.createChild(spaceId), {
        method: 'POST',
        body: {
          username: createdName,
          email: childForm.email.trim(),
          password: childForm.password,
          role: childForm.role,
          birthday: childForm.birthday
            ? new Date(childForm.birthday).toISOString()
            : undefined
        }
      })
      childForm.username = ''
      childForm.email = ''
      childForm.password = ''
      childForm.confirmPassword = ''
      childForm.birthday = ''
      appToast.success(
        t('dashboard.family.accountCreated'),
        t('dashboard.family.accountCreatedDescription', { name: createdName })
      )
      await refresh()
      return true
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'data' in e
        && typeof (e as { data?: { message?: string } }).data?.message === 'string'
        ? (e as { data: { message: string } }).data.message
        : ''
      appToast.errorMessage(
        message.includes('exist')
          ? t('dashboard.family.childErrors.emailTaken')
          : t('dashboard.family.childErrors.createFailed')
      )
      return false
    } finally {
      inviting.value = false
    }
  }

  async function saveChildProfile(spaceId: string, memberId: string, refresh: () => Promise<void>) {
    saving.value = true
    try {
      await api(apiRoutes.spaces.memberChild(spaceId, memberId), {
        method: 'PATCH',
        body: allowanceForm
      })
      await refresh()
    } finally {
      saving.value = false
    }
  }

  async function addJar(spaceId: string, memberId: string, refresh: () => Promise<void>) {
    if (!jarName.value) return
    await api(apiRoutes.spaces.memberChild(spaceId, memberId), {
      method: 'POST',
      body: { name: jarName.value }
    })
    jarName.value = ''
    await refresh()
  }

  const splitForm = reactive({ name: '', category: 'FOOD', mode: 'EQUAL' as 'EQUAL' | 'PROPORTIONAL' | 'CUSTOM' })
  const splits = ref<Array<{ id: string, name: string, category: string | null, mode: string }>>([])

  async function fetchSplits(spaceId: string) {
    splits.value = await api(apiRoutes.spaces.splits(spaceId))
  }

  async function createSplit(spaceId: string) {
    await api(apiRoutes.spaces.splits(spaceId), {
      method: 'POST',
      body: splitForm
    })
    splitForm.name = ''
    await fetchSplits(spaceId)
  }

  async function removeMember(spaceId: string, memberId: string, refresh: () => Promise<void>) {
    await api(apiRoutes.spaces.member(spaceId, memberId), { method: 'DELETE' })
    await refresh()
  }

  async function deleteChildAccount(spaceId: string, memberId: string, refresh: () => Promise<void>) {
    await api(apiRoutes.spaces.member(spaceId, memberId), {
      method: 'DELETE',
      body: { purge: true }
    })
    await refresh()
  }

  function loadAllowanceFromMember(data: MemberFinancial | null) {
    const profile = data?.member.childProfile
    if (!profile) return
    allowanceForm.allowance = profile.allowance ?? 0
    allowanceForm.frequency = (profile.frequency as typeof allowanceForm.frequency) ?? 'WEEKLY'
    allowanceForm.learnMode = profile.learnMode
  }

  return {
    inviting,
    saving,
    tab,
    memberTab,
    inviteForm,
    childForm,
    allowanceForm,
    jarName,
    tabs,
    childRoleItems,
    frequencyItems,
    categoryItems,
    memberTabs,
    fmt,
    roleLabel,
    statusLabel,
    formatDate,
    categoryLabel,
    transactionColumns,
    fetchSpaceDetail,
    fetchMemberFinancial,
    inviteMember,
    addChild,
    saveChildProfile,
    addJar,
    splitForm,
    splits,
    fetchSplits,
    createSplit,
    removeMember,
    deleteChildAccount,
    loadAllowanceFromMember
  }
})
