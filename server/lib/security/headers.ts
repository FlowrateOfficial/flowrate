// ANCHOR: HTTP security headers — CSP, HSTS, frame/embed lockdown
import type { H3Event } from 'h3'

function appOrigin(event: H3Event): string {
  const config = useRuntimeConfig(event)
  const configured = config.public.appUrl as string
  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      // NOTE - invalid APP_URL in config
    }
  }
  return getRequestURL(event).origin
}

export function applySecurityHeaders(event: H3Event) {
  const origin = appOrigin(event)
  const isProd = process.env.NODE_ENV === 'production'

  setResponseHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  })

  if (isProd) {
    setResponseHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // NOTE - CSP: Nuxt UI, Stripe.js, Google fonts, same-origin API
  const csp = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `script-src 'self' 'unsafe-inline' https://js.stripe.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' ${origin} https://api.stripe.com https://*.stripe.com`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`
  ].join('; ')

  setResponseHeader(event, 'Content-Security-Policy', csp)
}
