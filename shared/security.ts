// ANCHOR: Security constants — CSRF, auth proxy allowlist, exempt API paths
export const CSRF_COOKIE = 'flowrate-csrf'
export const CSRF_HEADER = 'x-csrf-token'

export const SECURITY_EXEMPT_PREFIXES = [
  '/api/stripe/webhook',
  '/api/plaid/webhook',
  '/api/webhooks/neon-auth',
  '/api/auth/'
] as const

export const ALLOWED_AUTH_PATH_PREFIXES = [
  'get-session',
  'sign-in',
  'sign-up',
  'sign-out',
  'forget-password',
  'forgot-password',
  'reset-password',
  'verify-email',
  'callback',
  'oauth2',
  'passkey',
  'delete-user',
  'change-password',
  'change-email',
  'session',
  'update-user',
  'revoke-session',
  'revoke-sessions',
  'list-sessions',
  'email-otp',
  'phone-number',
  'magic-link'
] as const

export function isSecurityExemptPath(path: string): boolean {
  return SECURITY_EXEMPT_PREFIXES.some(prefix => path.startsWith(prefix))
}

export function isAllowedAuthProxyPath(path: string): boolean {
  const normalized = path.replace(/^\/+/, '').toLowerCase()
  if (!normalized || normalized.includes('..') || normalized.includes('\\')) {
    return false
  }
  return ALLOWED_AUTH_PATH_PREFIXES.some(
    prefix => normalized === prefix || normalized.startsWith(`${prefix}/`)
  )
}
