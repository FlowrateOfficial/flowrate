/**
 * Typed wrapper around nuxt-i18n-micro for cleaner component code.
 */
export function useAppI18n() {
  const { t, getLocale, switchLocale, getLocales } = useI18n()

  function spaceType(type: string) {
    return t(`spaceTypes.${type}`)
  }

  return {
    t,
    getLocale,
    switchLocale,
    getLocales,
    spaceType,
    intlLocale: computed(() => (getLocale() === 'fr' ? 'fr-FR' : 'en-US'))
  }
}
