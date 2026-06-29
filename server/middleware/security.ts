// ANCHOR: Global security middleware — headers, rate limits, CSRF, origin checks
import { isSecurityExemptPath } from '#shared/security'
import { applySecurityHeaders } from '../lib/security/headers'
import { assertSameOriginMutation } from '../lib/security/origin'
import { assertCsrfToken, ensureCsrfCookie } from '../lib/security/csrf'
import { rateLimit } from '../lib/security/rate-limit'

const STATIC_PREFIXES = ['/_nuxt', '/__nuxt', '/_locales', '/_ipx', '/favicon.ico', '/sw.js']

export default defineEventHandler((event) => {
  const path = event.path

  if (STATIC_PREFIXES.some(prefix => path.startsWith(prefix))) {
    return
  }

  applySecurityHeaders(event)

  if (path.startsWith('/api/') && !path.startsWith('/api/stripe/webhook') && !path.startsWith('/api/plaid/webhook') && path !== '/api/webhooks/neon-auth') {
    rateLimit(event, 'api', { max: 240, windowMs: 60_000 })
  }

  const method = event.method.toUpperCase()

  if (path.startsWith('/api/auth/')) {
    rateLimit(event, 'auth', { max: 60, windowMs: 60_000 })
    const action = path.split('/').pop() ?? ''
    if (['sign-in', 'sign-up', 'forget-password', 'forgot-password', 'reset-password'].includes(action)) {
      rateLimit(event, `auth:${action}`, { max: 10, windowMs: 15 * 60_000 })
    }
    if (method === 'GET' || method === 'HEAD') {
      ensureCsrfCookie(event)
    }
    return
  }

  if (path.startsWith('/api/invitations/') && path.endsWith('/resend-phone')) {
    rateLimit(event, 'invite-resend', { max: 5, windowMs: 60 * 60_000 })
  }

  if (path.startsWith('/api/invitations/') && path.endsWith('/verify-phone')) {
    rateLimit(event, 'invite-verify', { max: 15, windowMs: 60 * 60_000 })
  }

  if (path === '/api/user/account' && event.method === 'DELETE') {
    rateLimit(event, 'account-delete', { max: 3, windowMs: 60 * 60_000 })
  }

  if (path.startsWith('/api/user/phone/')) {
    rateLimit(event, 'phone-verify', { max: 10, windowMs: 60 * 60_000 })
  }

  if (!path.startsWith('/api/')) {
    ensureCsrfCookie(event)
    return
  }

  if (isSecurityExemptPath(path)) {
    if (method === 'GET' || method === 'HEAD') {
      ensureCsrfCookie(event)
    }
    return
  }

  if (method === 'GET' || method === 'HEAD') {
    ensureCsrfCookie(event)
    return
  }

  assertSameOriginMutation(event)
  assertCsrfToken(event)
})
