// ANCHOR: Same-origin checks for state-changing API requests
import type { H3Event } from 'h3'

function allowedOrigins(event: H3Event): Set<string> {
  const config = useRuntimeConfig(event)
  const origins = new Set<string>()
  origins.add(getRequestURL(event).origin)

  const appUrl = config.public.appUrl as string
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin)
    } catch {
      // NOTE - ignore invalid APP_URL
    }
  }

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    origins.add(`https://${vercelUrl}`)
  }

  return origins
}

export function assertSameOriginMutation(event: H3Event) {
  const method = event.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return
  }

  const allowed = allowedOrigins(event)
  const origin = getRequestHeader(event, 'origin')
  if (origin) {
    if (!allowed.has(origin)) {
      throw createError({ statusCode: 403, message: 'Invalid origin' })
    }
    return
  }

  const secFetchSite = getRequestHeader(event, 'sec-fetch-site')
  if (secFetchSite === 'cross-site') {
    throw createError({ statusCode: 403, message: 'Cross-site request blocked' })
  }

  const referer = getRequestHeader(event, 'referer')
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin
      if (!allowed.has(refererOrigin)) {
        throw createError({ statusCode: 403, message: 'Invalid referer' })
      }
      return
    } catch {
      throw createError({ statusCode: 403, message: 'Invalid referer' })
    }
  }

  // NOTE - SSR / same-origin fetches without Origin header are allowed
}
