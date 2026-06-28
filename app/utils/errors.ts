// ANCHOR: API/auth error → i18n keys (never surface raw server messages in UI)
type TranslateFn = (key: string, params?: Record<string, string | number>) => string

interface FetchErrorLike {
  data?: { message?: string; statusMessage?: string; code?: string }
  statusCode?: number
  statusMessage?: string
  message?: string
}

const STATUS_KEYS: Record<number, string> = {
  400: 'errors.badRequest',
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
  404: 'errors.notFound',
  409: 'errors.conflict',
  422: 'errors.validation',
  429: 'errors.rateLimit',
  500: 'errors.server',
  503: 'errors.unavailable'
}

export function resolveErrorMessage(
  error: unknown,
  t: TranslateFn,
  fallbackKey = 'errors.generic'
): string {
  if (!error) return t(fallbackKey)

  const err = error as FetchErrorLike & { code?: string }
  const code = err.data?.code ?? err.code

  if (code && t(`errors.codes.${code}`) !== `errors.codes.${code}`) {
    return t(`errors.codes.${code}`)
  }

  const status = err.statusCode ?? (error as { status?: number }).status
  if (status && STATUS_KEYS[status]) {
    return t(STATUS_KEYS[status])
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('invalid') && (msg.includes('password') || msg.includes('credential'))) {
      return t('auth.login.errorInvalid')
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return t('errors.network')
    }
  }

  return t(fallbackKey)
}
