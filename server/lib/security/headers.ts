// ANCHOR: HTTP security headers — CSP, HSTS, frame/embed lockdown
import type { H3Event } from 'h3'
import { buildContentSecurityPolicy } from './csp'

export function applySecurityHeaders(event: H3Event) {
  const isProd = process.env.NODE_ENV === 'production'

  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Resource-Policy': 'same-origin'
  })

  if (isProd) {
    setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  setResponseHeader(event, 'Content-Security-Policy', buildContentSecurityPolicy(event))
}
