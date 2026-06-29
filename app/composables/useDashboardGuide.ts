export type DashboardAudience = 'child' | 'teen' | 'parent' | 'business' | 'general'

export function useDashboardGuide() {
  const { t } = useAppI18n()
  const spacesStore = useSpacesStore()

  const audience = computed<DashboardAudience>(() => {
    if (spacesStore.isChildManaged) return 'child'
    if (spacesStore.isTeenView) return 'teen'
    if (spacesStore.isCompany) return 'business'
    if (spacesStore.isSharedSpace) return 'parent'
    return 'general'
  })

  const guideTitle = computed(() => t(`dashboard.guide.${audience.value}.title`))
  const guideDescription = computed(() => t(`dashboard.guide.${audience.value}.description`))

  const guideSteps = computed(() => {
    const key = `dashboard.guide.${audience.value}.steps`
    const raw = t(key)
    if (raw === key) return []
    return raw.split('|').map(s => s.trim()).filter(Boolean)
  })

  return {
    audience,
    guideTitle,
    guideDescription,
    guideSteps
  }
}
