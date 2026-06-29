import type { ActiveSpace, FinancialSpaceSummary } from '~/types/space'
import { isTeenOrChild } from '~/types/space'
import { planHasFeature } from '#shared/plan-limits'
import { useActivePlan } from '~/composables/useActivePlan'
import { createSpaceSchema } from '~/utils/schemas'
import { resolveErrorMessage } from '~/utils/errors'
import { resolvePathAfterSpaceSwitch } from '~/utils/space-routes'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export const useSpacesStore = defineStore('spaces', () => {
  const { t, spaceType } = useAppI18n()
  const appToast = useAppToast()

  const space = ref<ActiveSpace | null>(null)
  const spaces = ref<FinancialSpaceSummary[]>([])
  const loading = ref(false)
  const switching = ref(false)
  const creating = ref(false)
  const showCreate = ref(false)
  const createForm = reactive({ name: '', type: 'HOUSEHOLD' as 'HOUSEHOLD' | 'FAMILY' | 'COMPANY' })

  const createSchema = createSpaceSchema()
  const { api } = useApi()
  const activePlan = useActivePlan()

  const isMinor = computed(() => (spaces.value ?? []).some(s => isTeenOrChild(s.role)))
  const minorSpace = computed(() => spaces.value.find(s => isTeenOrChild(s.role)) ?? null)
  const isTeenView = computed(() => minorSpace.value?.role === 'TEEN')
  const isChildManaged = computed(() => minorSpace.value?.role === 'CHILD')
  const isCompany = computed(() => space.value?.type === 'COMPANY')
  const isBusinessReadOnly = computed(() =>
    space.value?.type === 'COMPANY' && space.value?.role === 'GUEST'
  )
  const canManageBusiness = computed(() =>
    space.value?.type === 'COMPANY'
    && ['OWNER', 'FINANCE_ADMIN'].includes(space.value?.role ?? '')
  )
  const isSharedSpace = computed(() =>
    space.value?.type === 'HOUSEHOLD'
    || space.value?.type === 'FAMILY'
    || space.value?.type === 'COMPANY'
  )

  const spaceTypes = computed(() => {
    if (!planHasFeature(activePlan.value, 'sharedSpaces')) return []

    return [
      { value: 'HOUSEHOLD' as const, label: t('dashboard.spaces.types.household.label'), icon: 'i-lucide-heart-handshake', description: t('dashboard.spaces.types.household.description') },
      { value: 'FAMILY' as const, label: t('dashboard.spaces.types.family.label'), icon: 'i-lucide-users', description: t('dashboard.spaces.types.family.description') },
      { value: 'COMPANY' as const, label: t('dashboard.spaces.types.company.label'), icon: 'i-lucide-building-2', description: t('dashboard.spaces.types.company.description') }
    ]
  })

  const canCreateSharedSpace = computed(() => planHasFeature(activePlan.value, 'sharedSpaces'))

  function clearSession() {
    space.value = null
    spaces.value = []
  }

  async function fetchSpaces() {
    loading.value = true
    try {
      const result = await api<{ spaceId: string | null, spaces: FinancialSpaceSummary[] }>(
        apiRoutes.spaces.list,
        { noSpace: true }
      )
      const list = result.spaces
      spaces.value = list

      const minor = list.find(s => isTeenOrChild(s.role))
      const current = minor
        ?? list.find(s => s.id === result.spaceId)
        ?? list.find(s => s.type === 'INDEPENDENT')
        ?? list[0]

      if (current) {
        space.value = current
      }

      if (minor && minor.id !== result.spaceId) {
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
      appToast.warning(t('dashboard.spaces.minorCannotSwitch'))
      return
    }

    switching.value = true
    try {
      const result = await api<ActiveSpace>(apiRoutes.spaces.active, {
        method: 'POST',
        body: { spaceId },
        noSpace: true
      })
      space.value = result
      const idx = spaces.value.findIndex(s => s.id === spaceId)
      if (idx >= 0) spaces.value[idx] = { ...spaces.value[idx], ...result }

      const router = useRouter()
      const currentPath = router.currentRoute.value.path
      const targetPath = resolvePathAfterSpaceSwitch(currentPath, result)

      if (targetPath !== currentPath) {
        await navigateTo(targetPath, { replace: true })
      } else {
        await refreshNuxtData()
      }
    } finally {
      switching.value = false
    }
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
      appToast.success(
        t('dashboard.spaces.created'),
        t('dashboard.spaces.createdDescription', { name: space.name })
      )
      return true
    } catch (e) {
      appToast.errorFrom(e, 'dashboard.spaces.tryAgain', t('dashboard.spaces.createFailed'))
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
    return space.value ? { spaceId: space.value.id } : {}
  }

  function spaceHeaders(): Record<string, string> {
    return space.value ? { 'x-flowrate-space': space.value.id } : {}
  }

  return {
    space,
    spaces,
    loading,
    switching,
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
    canCreateSharedSpace,
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
