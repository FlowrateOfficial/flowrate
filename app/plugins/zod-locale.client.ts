import { applyZodLocale } from '~/utils/i18n'

export default defineNuxtPlugin(async () => {
  const { getLocale } = useI18n()

  await applyZodLocale(getLocale())

  const router = useRouter()
  router.afterEach(async () => {
    await applyZodLocale(getLocale())
  })
})
