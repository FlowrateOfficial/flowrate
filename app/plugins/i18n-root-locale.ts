// ANCHOR: Root locale plugin — single locales/en.json chunk
export default defineNuxtPlugin({
  name: 'flowrate-i18n-root-locale',
  enforce: 'post',
  async setup(nuxtApp) {
    const i18n = nuxtApp.$i18n as {
      $getLocale?: () => string
      $switchContext?: (locale: string, routeName: string) => Promise<void>
    } | undefined

    if (!i18n?.$switchContext || !i18n.$getLocale) return

    const switchContext = i18n.$switchContext
    const getLocale = i18n.$getLocale

    async function useRootLocale() {
      const locale = getLocale() || 'en'
      await switchContext(locale, 'index')
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
