// ANCHOR: Toast when useAsyncData error ref becomes set
import type { Ref } from 'vue'

export function useAsyncErrorToast(
  error: Ref<Error | null | undefined>,
  titleKey: string,
  descriptionKey?: string
) {
  const { t } = useAppI18n()
  const appToast = useAppToast()

  watch(error, (value) => {
    if (!value) return
    appToast.error(
      t(titleKey),
      descriptionKey ? t(descriptionKey) : undefined
    )
  }, { immediate: true })
}
