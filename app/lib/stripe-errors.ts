// ANCHOR: Stripe FC user-cancel detection — not an application error
export function isStripeConnectCancelled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const err = error as { type?: string, code?: string, message?: string }
  if (err.type === 'validation_error' && err.code === 'financial_connections_session_cancelled') {
    return true
  }

  return (err.message?.toLowerCase() ?? '').includes('cancel')
}
