// ANCHOR: Secure defaults for first-party app cookies (not Neon Auth)
import type { H3Event } from 'h3'

export function secureAppCookieOptions(event: H3Event) {
  const isHttps = getRequestURL(event).protocol === 'https:'
  return {
    path: '/',
    sameSite: 'strict' as const,
    secure: isHttps,
    httpOnly: true
  }
}
