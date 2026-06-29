// ANCHOR: In-memory per-IP rate limiting
import type { H3Event } from 'h3'

interface RateLimitOptions {
  max: number
  windowMs: number
}

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

function cleanup(now: number) {
  if (buckets.size < 5000) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export function clientIp(event: H3Event): string {
  const forwarded = getRequestHeader(event, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]!.trim()
  }
  return event.node?.req?.socket?.remoteAddress ?? 'unknown'
}

export function rateLimit(event: H3Event, key: string, options: RateLimitOptions) {
  const now = Date.now()
  cleanup(now)

  const bucketKey = `${key}:${clientIp(event)}`
  const existing = buckets.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs })
    return
  }

  existing.count += 1
  if (existing.count > options.max) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
    setResponseHeader(event, 'Retry-After', retryAfter)
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.'
    })
  }
}
