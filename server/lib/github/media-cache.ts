// NOTE - ANCHOR: In-memory cache for proxied GitHub media (per server instance)

const MAX_ENTRIES = 64
const MAX_BYTES = 8 * 1024 * 1024
const TTL_MS = 60 * 60 * 1000

interface CacheEntry {
  body: Buffer
  mimeType: string
  etag: string
  expiresAt: number
  bytes: number
}

const cache = new Map<string, CacheEntry>()
let totalBytes = 0

function cacheKey(ref: string, path: string): string {
  return `${ref}:${path}`
}

function evictExpired(now: number): void {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      totalBytes -= entry.bytes
      cache.delete(key)
    }
  }
}

function evictOldest(): void {
  const oldest = cache.keys().next().value
  if (!oldest) return
  const entry = cache.get(oldest)
  if (entry) totalBytes -= entry.bytes
  cache.delete(oldest)
}

function setEntry(key: string, entry: CacheEntry): void {
  const existing = cache.get(key)
  if (existing) {
    totalBytes -= existing.bytes
    cache.delete(key)
  }

  while ((cache.size >= MAX_ENTRIES || totalBytes + entry.bytes > MAX_BYTES * MAX_ENTRIES) && cache.size > 0) {
    evictOldest()
  }

  cache.set(key, entry)
  totalBytes += entry.bytes
}

export function getCachedFeedbackMedia(
  ref: string,
  path: string,
  ifNoneMatch?: string | null
): { body: Buffer, mimeType: string, etag: string } | null | 'not-modified' {
  const now = Date.now()
  evictExpired(now)

  const key = cacheKey(ref, path)
  const entry = cache.get(key)
  if (!entry || entry.expiresAt <= now) {
    if (entry) {
      totalBytes -= entry.bytes
      cache.delete(key)
    }
    return null
  }

  if (ifNoneMatch && ifNoneMatch === entry.etag) {
    return 'not-modified'
  }

  return {
    body: entry.body,
    mimeType: entry.mimeType,
    etag: entry.etag
  }
}

export function setCachedFeedbackMedia(
  ref: string,
  path: string,
  body: Buffer,
  mimeType: string,
  sha?: string | null
): string {
  const etag = sha ? `"${sha}"` : `"${Buffer.from(`${ref}:${path}:${body.byteLength}`).toString('base64url')}"`
  const entry: CacheEntry = {
    body,
    mimeType,
    etag,
    expiresAt: Date.now() + TTL_MS,
    bytes: body.byteLength
  }

  if (entry.bytes <= MAX_BYTES) {
    setEntry(cacheKey(ref, path), entry)
  }

  return etag
}
