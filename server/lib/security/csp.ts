import type { H3Event } from 'h3'
import { normalizePlaidEnv } from '#shared/plaid-config'

const PLAID_LINK_SCRIPT = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
const VERCEL_SPEED_INSIGHTS_SCRIPT = 'https://va.vercel-scripts.com'
const VERCEL_SPEED_INSIGHTS_CONNECT = 'https://vitals.vercel-insights.com'

function isLocalhostOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin)
    return hostname === 'localhost' || hostname === '127.0.0.1'
  } catch {
    return false
  }
}

// NOTE - Origins for connect-src / form-action (host + deploy URLs)
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

function plaidConnectSrc(event: H3Event): string[] {
  const config = useRuntimeConfig(event)
  if (!config.plaidClientId || !config.plaidSecret) return []

  const env = normalizePlaidEnv(config.plaidEnv)
  const apiHost = env === 'production'
    ? 'https://production.plaid.com'
    : 'https://sandbox.plaid.com'

  return [
    'https://cdn.plaid.com',
    apiHost
  ]
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
    'https://api.github.com',
    'https://api.mapbox.com',
    'https://events.mapbox.com',
    VERCEL_SPEED_INSIGHTS_CONNECT,
    ...plaidConnectSrc(event)
  ]

  const neonAuthUrl = useRuntimeConfig(event).public.neonAuthUrl as string
  if (neonAuthUrl) {
    try {
      connectSrc.push(new URL(neonAuthUrl).origin)
    } catch {
      // NOTE - ignore invalid Neon Auth URL
    }
  }

  const plaidEnabled = plaidConnectSrc(event).length > 0

  return [
    `default-src 'self'${plaidEnabled ? ' https://cdn.plaid.com' : ''}`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `script-src 'self' 'unsafe-inline' https://js.stripe.com ${VERCEL_SPEED_INSIGHTS_SCRIPT}${plaidEnabled ? ` ${PLAID_LINK_SCRIPT}` : ''}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `style-src-attr 'unsafe-inline'`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https:`,
    `connect-src ${connectSrc.join(' ')}`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com${plaidEnabled ? ' https://cdn.plaid.com' : ''}`
  ].join('; ')
}
