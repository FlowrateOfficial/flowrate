// ANCHOR: Typed nuxt-i18n-micro wrapper
type TranslateParams = Record<string, string | number>

export function useAppI18n() {
  const { t: rawT, getLocale, switchLocale, getLocales } = useI18n()

  const t = (key: string, params?: TranslateParams): string => {
    const result = rawT(key, params as never)
    return result == null ? key : String(result)
  }

  function spaceType(type: string) {
    return t(`spaceTypes.${type}`)
  }

  function categoryLabel(cat: string): string {
    const key = `categories.${cat}`
    const translated = t(key)
    return translated !== key ? translated : cat
  }

  return {
    t,
    getLocale,
    switchLocale,
    getLocales,
    spaceType,
    categoryLabel,
    intlLocale: computed(() => (getLocale() === 'fr' ? 'fr-FR' : 'en-US'))
  }
}
