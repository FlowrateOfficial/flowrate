import type { ActiveSpace, FinancialSpaceSummary } from '~/types/space'
import { isTeenOrChild } from '~/types/space'
import { createSpaceSchema } from '~/utils/schemas'
import { resolveErrorMessage } from '~/utils/errors'
import { apiRoutes, useApi } from '~/lib/api'

const ACTIVE_SPACE_KEY = 'flowrate-active-space'

export const useSpacesStore = defineStore('spaces', () => {
  const { t, spaceType } = useAppI18n()
  const toast = useToast()
  const activeSpaceIdCookie = useCookie<string | null>(ACTIVE_SPACE_KEY, {
    default: () => null,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })

  const activeSpace = ref<ActiveSpace | null>(null)
  const spaces = ref<FinancialSpaceSummary[]>([])
  const loading = ref(false)
  const creating = ref(false)
  const showCreate = ref(false)
  const createForm = reactive({ name: '', type: 'HOUSEHOLD' as 'HOUSEHOLD' | 'FAMILY' | 'COMPANY' })

  const createSchema = createSpaceSchema()
  const { api } = useApi()

  const isMinor = computed(() => (spaces.value ?? []).some(s => isTeenOrChild(s.role)))
  const minorSpace = computed(() => spaces.value.find(s => isTeenOrChild(s.role)) ?? null)
  const isTeenView = computed(() => minorSpace.value?.role === 'TEEN')
  const isChildManaged = computed(() => minorSpace.value?.role === 'CHILD')
  const isCompany = computed(() => activeSpace.value?.type === 'COMPANY')
  const isBusinessReadOnly = computed(() =>
    activeSpace.value?.type === 'COMPANY' && activeSpace.value?.role === 'GUEST'
  )
  const canManageBusiness = computed(() =>
    activeSpace.value?.type === 'COMPANY'
    && ['OWNER', 'FINANCE_ADMIN'].includes(activeSpace.value?.role ?? '')
  )
  const isSharedSpace = computed(() =>
    activeSpace.value?.type === 'HOUSEHOLD'
    || activeSpace.value?.type === 'FAMILY'
    || activeSpace.value?.type === 'COMPANY'
  )

  const spaceTypes = computed(() => [
    { value: 'HOUSEHOLD' as const, label: t('dashboard.spaces.types.household.label'), icon: 'i-lucide-heart-handshake', description: t('dashboard.spaces.types.household.description') },
    { value: 'FAMILY' as const, label: t('dashboard.spaces.types.family.label'), icon: 'i-lucide-users', description: t('dashboard.spaces.types.family.description') },
    { value: 'COMPANY' as const, label: t('dashboard.spaces.types.company.label'), icon: 'i-lucide-building-2', description: t('dashboard.spaces.types.company.description') }
  ])

  function clearSession() {
    activeSpace.value = null
    spaces.value = []
    activeSpaceIdCookie.value = null
  }

  async function fetchSpaces() {
    loading.value = true
    try {
      const list = await api<FinancialSpaceSummary[]>(apiRoutes.spaces.list, { noSpace: true })
      spaces.value = list

      const minor = list.find(s => isTeenOrChild(s.role))
      const storedId = activeSpaceIdCookie.value
      const current = minor
        ?? list.find(s => s.id === storedId)
        ?? list.find(s => s.type === 'INDEPENDENT')
        ?? list[0]

      if (current) {
        activeSpace.value = current
        activeSpaceIdCookie.value = current.id
      }

      if (minor && minor.id !== storedId) {
        await api<ActiveSpace>(apiRoutes.spaces.active, {
          method: 'POST',
          body: { spaceId: minor.id },
          noSpace: true
        }).catch(() => {})
      }
    } finally {
      loading.value = false
    }
  }

  async function switchSpace(spaceId: string) {
    if (isMinor.value && spaceId !== minorSpace.value?.id) {
      toast.add({
        title: t('dashboard.spaces.minorCannotSwitch'),
        color: 'warning'
      })
      return
    }

    const result = await api<ActiveSpace>(apiRoutes.spaces.active, {
      method: 'POST',
      body: { spaceId },
      noSpace: true
    })
    activeSpace.value = result
    const idx = spaces.value.findIndex(s => s.id === spaceId)
    if (idx >= 0) spaces.value[idx] = { ...spaces.value[idx], ...result }
    activeSpaceIdCookie.value = spaceId
    await refreshNuxtData()
  }

  async function createSpace() {
    creating.value = true
    try {
      const parsed = createSchema.parse(createForm)
      const space = await api<{ id: string; name: string }>(apiRoutes.spaces.list, {
        method: 'POST',
        body: parsed,
        noSpace: true
      })
      await fetchSpaces()
      await switchSpace(space.id)
      showCreate.value = false
      createForm.name = ''
      toast.add({
        title: t('dashboard.spaces.created'),
        description: t('dashboard.spaces.createdDescription', { name: space.name }),
        color: 'success'
      })
      return true
    } catch (e) {
      toast.add({
        title: t('dashboard.spaces.createFailed'),
        description: resolveErrorMessage(e, t, 'dashboard.spaces.tryAgain'),
        color: 'error'
      })
      return false
    } finally {
      creating.value = false
    }
  }

  function roleLabel(role: string) {
    const key = `roles.${role}`
    const translated = t(key)
    return translated !== key ? translated : role.toLowerCase().replace('_', ' ')
  }

  function spaceQuery() {
    return activeSpace.value ? { spaceId: activeSpace.value.id } : {}
  }

  function spaceHeaders(): Record<string, string> {
    return activeSpace.value ? { 'x-flowrate-space': activeSpace.value.id } : {}
  }

  return {
    activeSpace,
    spaces,
    loading,
    creating,
    showCreate,
    createForm,
    createSchema,
    isMinor,
    minorSpace,
    isTeenView,
    isChildManaged,
    isCompany,
    isBusinessReadOnly,
    canManageBusiness,
    isSharedSpace,
    spaceTypes,
    fetchSpaces,
    switchSpace,
    createSpace,
    clearSession,
    roleLabel,
    spaceType,
    spaceQuery,
    spaceHeaders
  }
})
