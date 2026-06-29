// ANCHOR: Plaid Link client error classification

export interface PlaidLinkError {
  error_type?: string
  error_code?: string
  error_message?: string
  display_message?: string | null
}

export function isPlaidLinkError(error: unknown): error is PlaidLinkError {
  return Boolean(
    error
    && typeof error === 'object'
    && ('error_code' in error || 'error_message' in error || 'display_message' in error)
  )
}

export function isPlaidConnectCancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'error_code' in error ? String((error as PlaidLinkError).error_code) : ''
  if (code === 'USER_EXIT' || code === 'EXIT') return true
  if (error instanceof Error && error.message === 'Plaid Link closed') return true
  return false
}

export function resolvePlaidLinkErrorMessage(error: unknown): string | null {
  if (isPlaidLinkError(error)) {
    if (error.display_message) return error.display_message
    if (error.error_message) return error.error_message
  }
  if (error instanceof Error) {
    if (error.message === 'Plaid Link failed to initialize') return error.message
    if (error.message === 'Failed to load Plaid Link') {
      // NOTE - Store resolves load failure via i18n
      return null
    }
  }
  return null
}
