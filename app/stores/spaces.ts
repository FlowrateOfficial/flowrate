import type { ActiveSpace, FinancialSpaceSummary } from '~/types/space'
import { createSpaceSchema } from '~/utils/schemas'
import { resolveErrorMessage } from '~/utils/errors'

const ACTIVE_SPACE_KEY = 'flowrate-active-space'

export const useSpacesStore = defineStore('spaces', () => {
  const { t, spaceType } = useAppI18n()
  const toast = useToast()

  const activeSpace = ref<ActiveSpace | null>(null)
  const spaces = ref<FinancialSpaceSummary[]>([])
  const loading = ref(false)
  const creating = ref(false)
  const showCreate = ref(false)
  const createForm = reactive({ name: '', type: 'HOUSEHOLD' as 'HOUSEHOLD' | 'FAMILY' | 'COMPANY' })

  const createSchema = createSpaceSchema()

  const isTeenView = computed(() => activeSpace.value?.role === 'TEEN')
  const isChildManaged = computed(() => activeSpace.value?.role === 'CHILD')
  const isCompany = computed(() => activeSpace.value?.type === 'COMPANY')
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
  }

  async function fetchSpaces() {
    loading.value = true
    try {
      const api = useApiFetch()
      const list = await api<FinancialSpaceSummary[]>('/api/spaces')
      spaces.value = list

      const storedId = import.meta.client ? localStorage.getItem(ACTIVE_SPACE_KEY) : null
      const current = list.find(s => s.id === storedId) ?? list.find(s => s.type === 'INDEPENDENT') ?? list[0]
      if (current) activeSpace.value = current
    } finally {
      loading.value = false
    }
  }

  async function switchSpace(spaceId: string) {
    const api = useApiFetch()
    const result = await api<ActiveSpace>('/api/spaces/active', {
      method: 'POST',
      body: { spaceId }
    })
    activeSpace.value = result
    const idx = spaces.value.findIndex(s => s.id === spaceId)
    if (idx >= 0) spaces.value[idx] = { ...spaces.value[idx], ...result }
    if (import.meta.client) localStorage.setItem(ACTIVE_SPACE_KEY, spaceId)
    await refreshNuxtData()
  }

  async function createSpace() {
    creating.value = true
    try {
      const parsed = createSchema.parse(createForm)
      const api = useApiFetch()
      const space = await api<{ id: string; name: string }>('/api/spaces', { method: 'POST', body: parsed })
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
    isTeenView,
    isChildManaged,
    isCompany,
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
