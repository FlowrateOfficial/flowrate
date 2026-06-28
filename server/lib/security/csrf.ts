// ANCHOR: CSRF double-submit cookie and header validation
import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { CSRF_COOKIE, CSRF_HEADER } from '#shared/security'

export function ensureCsrfCookie(event: H3Event) {
  const existing = getCookie(event, CSRF_COOKIE)
  if (existing) return existing

  const token = randomBytes(32).toString('base64url')
  const isHttps = getRequestURL(event).protocol === 'https:'

  setCookie(event, CSRF_COOKIE, token, {
    path: '/',
    sameSite: 'strict',
    secure: isHttps,
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7
  })

  return token
}

export function assertCsrfToken(event: H3Event) {
  const cookieToken = getCookie(event, CSRF_COOKIE)
  const headerToken = getRequestHeader(event, CSRF_HEADER)

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw createError({ statusCode: 403, message: 'Invalid CSRF token' })
  }
}
