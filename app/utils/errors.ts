// ANCHOR: Map API errors to i18n keys
type TranslateFn = (key: string, params?: Record<string, string | number>) => string

interface FetchErrorLike {
  data?: {
    message?: string
    statusMessage?: string
    code?: string
    data?: { message?: string, code?: string }
  }
  statusCode?: number
  statusMessage?: string
  message?: string
}

function extractApiErrorPayload(error: FetchErrorLike): { code?: string, message?: string } {
  const root = error.data
  if (!root) return {}

  if (root.data && typeof root.data === 'object') {
    return root.data
  }

  if (root.code || root.message) {
    return { code: root.code, message: root.message }
  }

  return {}
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
  502: 'errors.server',
  503: 'errors.unavailable'
}

export function resolveErrorMessage(
  error: unknown,
  t: TranslateFn,
  fallbackKey = 'errors.generic'
): string {
  if (!error) return t(fallbackKey)

  const err = error as FetchErrorLike & { code?: string }
  const payload = extractApiErrorPayload(err)
  const code = payload.code ?? err.data?.code ?? err.code

  if (code && t(`errors.codes.${code}`) !== `errors.codes.${code}`) {
    return t(`errors.codes.${code}`)
  }

  if (payload.message) {
    return payload.message
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
