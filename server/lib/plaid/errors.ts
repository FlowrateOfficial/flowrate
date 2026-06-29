// ANCHOR: Plaid API error parsing

export interface PlaidApiErrorBody {
  error_type?: string
  error_code?: string
  error_message?: string
  display_message?: string | null
  documentation_url?: string
  request_id?: string
}

export function parsePlaidApiError(error: unknown): PlaidApiErrorBody | null {
  if (!error || typeof error !== 'object') return null

  const response = (error as { response?: { data?: PlaidApiErrorBody } }).response
  if (response?.data?.error_code) return response.data

  const data = (error as { data?: PlaidApiErrorBody }).data
  if (data?.error_code) return data

  return null
}

export function plaidErrorMessage(error: unknown, fallback: string): string {
  const parsed = parsePlaidApiError(error)
  if (parsed?.display_message) return parsed.display_message
  if (parsed?.error_message) return parsed.error_message
  return fallback
}

export function throwPlaidError(error: unknown, fallback: string, statusCode = 502): never {
  const parsed = parsePlaidApiError(error)
  throw createError({
    statusCode,
    message: plaidErrorMessage(error, fallback),
    data: {
      code: parsed?.error_code ?? 'PLAID_API_ERROR',
      plaid: parsed ?? undefined
    }
  })
}
