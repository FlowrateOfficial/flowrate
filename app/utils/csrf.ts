import { CSRF_COOKIE } from '#shared/security'

export function readCsrfTokenFromDocument(): string | null {
  if (!import.meta.client) return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}
