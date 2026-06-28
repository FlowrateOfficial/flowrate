import type { H3Event } from 'h3'

function isLocalhostOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin)
    return hostname === 'localhost' || hostname === '127.0.0.1'
  } catch {
    return false
  }
}

/** Origins allowed in connect-src / form-action (request host + configured deploy URLs). */
export function collectAppOrigins(event: H3Event): string[] {
  const origins = new Set<string>()
  const requestOrigin = getRequestURL(event).origin
  origins.add(requestOrigin)

  const config = useRuntimeConfig(event)
  const appUrl = config.public.appUrl as string
  if (appUrl) {
    try {
      const origin = new URL(appUrl).origin
      if (process.env.NODE_ENV !== 'production' || !isLocalhostOrigin(origin)) {
        origins.add(origin)
      }
    } catch {
      // NOTE - ignore invalid APP_URL
    }
  }

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    origins.add(`https://${vercelUrl}`)
  }

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (productionHost) {
    origins.add(`https://${productionHost}`)
  }

  return [...origins]
}

export function buildContentSecurityPolicy(event: H3Event): string {
  const origins = collectAppOrigins(event)
  const connectSrc = [
    "'self'",
    ...origins,
    'https://api.stripe.com',
    'https://*.stripe.com',
    'https://accounts.google.com',
    'https://oauth2.googleapis.com',
    'https://github.com',
    'https://api.github.com'
  ]

  const neonAuthUrl = useRuntimeConfig(event).public.neonAuthUrl as string
  if (neonAuthUrl) {
    try {
      connectSrc.push(new URL(neonAuthUrl).origin)
    } catch {
      // NOTE - ignore invalid Neon Auth URL
    }
  }

  return [
    `default-src 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `script-src 'self' 'unsafe-inline' https://js.stripe.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https:`,
    `connect-src ${connectSrc.join(' ')}`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com`
  ].join('; ')
}
