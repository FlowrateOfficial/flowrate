// NOTE - ANCHOR: Load root locale on boot — avoids raw i18n keys when page chunks are empty
export default defineNuxtPlugin({
  name: 'flowrate-i18n-index',
  enforce: 'post',
  async setup(nuxtApp) {
    const i18n = nuxtApp.$i18n as {
      $getLocale?: () => string
      $switchContext?: (locale: string, routeName: string) => Promise<void>
    } | undefined

    if (!i18n?.$switchContext || !i18n.$getLocale) return

    const locale = i18n.$getLocale() || 'en'
    await i18n.$switchContext(locale, 'index')
  }
})
