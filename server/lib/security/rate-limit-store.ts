// ANCHOR: Rate limit storage — memory fallback, Upstash Redis in production
export interface RateLimitIncrementResult {
  count: number
  resetAt: number
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitIncrementResult>
}

class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, { count: number, resetAt: number }>()

  async increment(key: string, windowMs: number): Promise<RateLimitIncrementResult> {
    const now = Date.now()

    if (this.buckets.size >= 5000) {
      for (const [bucketKey, bucket] of this.buckets) {
        if (bucket.resetAt <= now) this.buckets.delete(bucketKey)
      }
    }

    const existing = this.buckets.get(key)
    if (!existing || existing.resetAt <= now) {
      const resetAt = now + windowMs
      this.buckets.set(key, { count: 1, resetAt })
      return { count: 1, resetAt }
    }

    existing.count += 1
    return { count: existing.count, resetAt: existing.resetAt }
  }
}

class UpstashRateLimitStore implements RateLimitStore {
  private readonly memoryFallback = new MemoryRateLimitStore()

  constructor(
    private readonly url: string,
    private readonly token: string
  ) {}

  async increment(key: string, windowMs: number): Promise<RateLimitIncrementResult> {
    try {
      return await this.incrementUpstash(key, windowMs)
    } catch (error) {
      console.warn('[rate-limit] Upstash unavailable, using in-memory fallback:', error)
      return this.memoryFallback.increment(key, windowMs)
    }
  }

  private async incrementUpstash(key: string, windowMs: number): Promise<RateLimitIncrementResult> {
    const response = await fetch(`${this.url}/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        ['INCR', key],
        ['PTTL', key]
      ])
    })

    if (!response.ok) {
      throw new Error(`Upstash rate limit failed: ${response.status}`)
    }

    const results = await response.json() as Array<{ result: number }>
    const count = Number(results[0]?.result ?? 1)
    let ttlMs = Number(results[1]?.result ?? -1)

    if (count === 1 || ttlMs < 0) {
      await fetch(`${this.url}/pexpire/${encodeURIComponent(key)}/${windowMs}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` }
      })
      ttlMs = windowMs
    }

    return {
      count,
      resetAt: Date.now() + Math.max(ttlMs, 0)
    }
  }
}

let store: RateLimitStore | null = null

export function getRateLimitStore(): RateLimitStore {
  if (store) return store

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  store = url && token
    ? new UpstashRateLimitStore(url, token)
    : new MemoryRateLimitStore()

  return store
}

/** @internal Test-only reset */
export function resetRateLimitStoreForTests() {
  store = null
}
