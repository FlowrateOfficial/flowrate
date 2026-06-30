// ANCHOR: Per-IP rate limiting — Upstash Redis or in-memory fallback
import type { H3Event } from 'h3'
import { getRateLimitStore } from './rate-limit-store'

export interface RateLimitOptions {
  max: number
  windowMs: number
}

export function clientIp(event: H3Event): string {
  const forwarded = getRequestHeader(event, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]!.trim()
  }
  return event.node?.req?.socket?.remoteAddress ?? 'unknown'
}

export async function rateLimit(event: H3Event, key: string, options: RateLimitOptions) {
  const bucketKey = `${key}:${clientIp(event)}`
  const { count, resetAt } = await getRateLimitStore().increment(bucketKey, options.windowMs)

  if (count > options.max) {
    const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
    setResponseHeader(event, 'Retry-After', retryAfter)
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.'
    })
  }
}
