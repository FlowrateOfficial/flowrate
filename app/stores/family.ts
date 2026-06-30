// ANCHOR: Family store — members, children, splits, allowance
import type { MemberFinancial, SpaceDetail } from '~/types/family'
import type { TransactionRow } from '~/types/financial'

export type { MemberFinancial, SpaceDetail, SpaceDetailMember } from '~/types/family'
import { createSpaceScopedLoader } from '~/utils/store-fetch'
import { createTransactionColumns } from '~/utils/table-columns'
import { planHasFeature } from '#shared/plan-limits'
import { ENUM } from '#shared/prisma-enums'
import { useActivePlan } from '~/composables/useActivePlan'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useFamilyStore = defineStore('family', () => {
  const { t, categoryLabel, formatCurrency, formatShortDateWithYear, roleLabel, memberStatusLabel } = useAppI18n()
  const spacesStore = useSpacesStore()
  const appToast = useAppToast()
  const { api } = useApi()
  const activePlan = useActivePlan()

  const inviting = ref(false)
  const saving = ref(false)
  const tab = ref('members')
  const memberTab = ref('overview')

  const inviteForm = reactive({ email: '', role: ENUM.role.CO_GUARDIAN, name: '' })
  const childForm = reactive({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ENUM.role.CHILD as typeof ENUM.role.CHILD | typeof ENUM.role.TEEN,
    birthday: ''
  })
  const allowanceForm = reactive({
    allowance: 0,
    frequency: ENUM.period.WEEKLY as typeof ENUM.period.WEEKLY | typeof ENUM.period.MONTHLY | typeof ENUM.period.YEARLY,
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
    // NOTE - Hide children tab when plan drops teen feature
    if (tab.value === 'children' && !items.some(item => item.value === 'children')) {
      tab.value = 'members'
    }
  })

  const childRoleItems = computed(() => [
    { label: t('dashboard.family.roleChild'), value: ENUM.role.CHILD },
    { label: t('dashboard.family.roleTeen'), value: ENUM.role.TEEN }
  ])

  const frequencyItems = computed(() => [
    { label: t('frequencies.WEEKLY'), value: ENUM.period.WEEKLY },
    { label: t('frequencies.MONTHLY'), value: ENUM.period.MONTHLY },
    { label: t('frequencies.YEARLY'), value: ENUM.period.YEARLY }
  ])

  const categoryItems = computed(() =>
    [
      ENUM.category.FOOD,
      ENUM.category.HOUSING,
      ENUM.category.UTILITIES,
      ENUM.category.ENTERTAINMENT,
      ENUM.category.OTHER
    ].map(c => ({
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

  function statusLabel(status: string) {
    return memberStatusLabel(status)
  }

  function formatDate(dateStr: string) {
    return formatShortDateWithYear(dateStr)
  }

  const transactionColumns = computed(() =>
    createTransactionColumns<TransactionRow>(t)
  )

  const spaceDetail = ref<SpaceDetail | null>(null)
  const detailView = ref<'guardians' | 'children'>('guardians')
  const activeMemberId = ref('')

  const {
    pending,
    load: loadSpaceDetail,
    reset: resetSpaceDetail
  } = createSpaceScopedLoader({
    buildKey: spaceId => `family:${spaceId}:${detailView.value}`,
    fetch: async (spaceId) => {
      return api<SpaceDetail>(apiRoutes.spaces.detail(spaceId), {
        query: { view: detailView.value }
      })
    },
    apply: data => { spaceDetail.value = data },
    clear: () => { spaceDetail.value = null },
    isCached: () => spaceDetail.value != null
  })

  const memberFinancial = ref<MemberFinancial | null>(null)
  const {
    pending: memberPending,
    load: loadMemberFinancial,
    reset: resetMemberFinancial
  } = createSpaceScopedLoader({
    buildKey: spaceId => `member-financial:${spaceId}:${activeMemberId.value}`,
    fetch: spaceId =>
      api<MemberFinancial>(apiRoutes.spaces.memberFinancial(spaceId, activeMemberId.value)),
    apply: data => { memberFinancial.value = data },
    clear: () => { memberFinancial.value = null },
    isCached: () => memberFinancial.value != null
  })

  function setDetailView(view: 'guardians' | 'children') {
    detailView.value = view
  }

  async function refreshSpaceDetail() {
    await loadSpaceDetail(true)
  }

  async function openMemberFinancial(memberId: string, force = false) {
    activeMemberId.value = memberId
    await loadMemberFinancial(force)
  }

  async function inviteMember(spaceId: string) {
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
      await refreshSpaceDetail()
    } finally {
      inviting.value = false
    }
  }

  async function addChild(spaceId: string) {
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
      await refreshSpaceDetail()
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

  async function saveChildProfile(spaceId: string, memberId: string) {
    saving.value = true
    try {
      await api(apiRoutes.spaces.memberChild(spaceId, memberId), {
        method: 'PATCH',
        body: allowanceForm
      })
      await openMemberFinancial(memberId, true)
    } finally {
      saving.value = false
    }
  }

  async function addJar(spaceId: string, memberId: string) {
    if (!jarName.value) return
    await api(apiRoutes.spaces.memberChild(spaceId, memberId), {
      method: 'POST',
      body: { name: jarName.value }
    })
    jarName.value = ''
    await openMemberFinancial(memberId, true)
  }

  const splitForm = reactive({
    name: '',
    category: ENUM.category.FOOD,
    mode: ENUM.split.EQUAL
  })
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

  async function removeMember(spaceId: string, memberId: string) {
    await api(apiRoutes.spaces.member(spaceId, memberId), { method: 'DELETE' })
    await refreshSpaceDetail()
  }

  async function deleteChildAccount(
    spaceId: string,
    memberId: string,
    onSuccess?: () => void | Promise<void>
  ) {
    await api(apiRoutes.spaces.member(spaceId, memberId), {
      method: 'DELETE',
      body: { purge: true }
    })
    await onSuccess?.()
    await refreshSpaceDetail()
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
    spaceDetail,
    pending,
    memberFinancial,
    memberPending,
    setDetailView,
    loadSpaceDetail,
    refreshSpaceDetail,
    openMemberFinancial,
    resetSpaceDetail,
    resetMemberFinancial,
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
