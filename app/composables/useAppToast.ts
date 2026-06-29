// ANCHOR: Nuxt UI toast helpers for app feedback
import { resolveErrorMessage } from '~/utils/errors'

type ToastColor = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'primary'

export function useAppToast() {
  const toast = useToast()
  const { t } = useAppI18n()

  function notify(options: {
    title: string
    description?: string
    color?: ToastColor
  }) {
    toast.add({
      title: options.title,
      description: options.description,
      color: options.color ?? 'neutral'
    })
  }

  function success(title: string, description?: string) {
    notify({ title, description, color: 'success' })
  }

  function error(title: string, description?: string) {
    notify({ title, description, color: 'error' })
  }

  function errorMessage(message: string) {
    notify({ title: message, color: 'error' })
  }

  function errorFrom(error: unknown, fallbackKey = 'errors.generic', title?: string) {
    notify({
      title: title ?? t('errors.generic'),
      description: resolveErrorMessage(error, t, fallbackKey),
      color: 'error'
    })
  }

  function warning(title: string, description?: string) {
    notify({ title, description, color: 'warning' })
  }

  function info(title: string, description?: string) {
    notify({ title, description, color: 'info' })
  }

  function neutral(title: string, description?: string) {
    notify({ title, description, color: 'neutral' })
  }

  return {
    notify,
    success,
    error,
    errorMessage,
    errorFrom,
    warning,
    info,
    neutral
  }
}
