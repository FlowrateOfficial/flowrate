// NOTE - ANCHOR: disablePageLocales — all copy lives in locales/en.json, loaded as the index chunk
export default defineNuxtPlugin({
  name: 'flowrate-i18n-root-locale',
  enforce: 'post',
  async setup(nuxtApp) {
    const i18n = nuxtApp.$i18n as {
      $getLocale?: () => string
      $switchContext?: (locale: string, routeName: string) => Promise<void>
    } | undefined

    if (!i18n?.$switchContext || !i18n.$getLocale) return

    async function useRootLocale() {
      const locale = i18n.$getLocale?.() || 'en'
      await i18n.$switchContext!(locale, 'index')
    }

    await useRootLocale()

    if (import.meta.client) {
      const router = useRouter()
      router.beforeEach(async () => {
        await useRootLocale()
      })
    }
  }
})
