import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'
import { planHasFeature } from '#shared/plan-limits'
import { useActivePlan } from '~/composables/useActivePlan'

export const useOnboardingStore = defineStore('onboarding', () => {
  const { t } = useAppI18n()
  const spacesStore = useSpacesStore()
  const router = useRouter()
  const { api } = useApi()
  const activePlan = useActivePlan()

  const step = ref(1)
  const selected = ref<'INDEPENDENT' | 'HOUSEHOLD' | 'FAMILY' | 'COMPANY' | null>(null)
  const spaceName = ref('')
  const loading = ref(false)

  const options = computed(() => {
    const all = [
      { type: 'INDEPENDENT' as const, title: t('dashboard.onboarding.types.independent.title'), icon: 'i-lucide-user', description: t('dashboard.onboarding.types.independent.description') },
      { type: 'HOUSEHOLD' as const, title: t('dashboard.onboarding.types.household.title'), icon: 'i-lucide-heart-handshake', description: t('dashboard.onboarding.types.household.description') },
      { type: 'FAMILY' as const, title: t('dashboard.onboarding.types.family.title'), icon: 'i-lucide-users', description: t('dashboard.onboarding.types.family.description') },
      { type: 'COMPANY' as const, title: t('dashboard.onboarding.types.company.title'), icon: 'i-lucide-building-2', description: t('dashboard.onboarding.types.company.description') }
    ]

    if (!planHasFeature(activePlan.value, 'sharedSpaces')) {
      return all.filter(option => option.type === 'INDEPENDENT')
    }

    return all
  })

  function defaultName(type: string) {
    if (type === 'HOUSEHOLD') return t('dashboard.onboarding.defaultNames.household')
    if (type === 'FAMILY') return t('dashboard.onboarding.defaultNames.family')
    if (type === 'COMPANY') return t('dashboard.onboarding.defaultNames.company')
    return t('dashboard.onboarding.defaultNames.independent')
  }

  function selectType(type: typeof selected.value) {
    selected.value = type
  }

  function goBack() {
    step.value--
  }

  function continueFromStep1() {
    if (!selected.value) return
    if (selected.value === 'INDEPENDENT') finish()
    else step.value = 2
  }

  async function finish() {
    if (!selected.value) return
    loading.value = true
    try {
      if (selected.value !== 'INDEPENDENT') {
        const name = spaceName.value || defaultName(selected.value)
        const space = await api<{ id: string }>(apiRoutes.spaces.list, {
          method: 'POST',
          body: { name, type: selected.value },
          noSpace: true
        })
        await spacesStore.switchSpace(space.id)
      }
      await router.push('/dashboard')
    } finally {
      loading.value = false
    }
  }

  return {
    step,
    selected,
    spaceName,
    loading,
    options,
    defaultName,
    selectType,
    goBack,
    continueFromStep1,
    finish
  }
})
