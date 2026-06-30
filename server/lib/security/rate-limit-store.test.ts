import { describe, expect, it } from 'vitest'
import { getRateLimitStore, resetRateLimitStoreForTests } from './rate-limit-store'

describe('rate-limit-store memory fallback', () => {
  it('increments counts within the same window', async () => {
    resetRateLimitStoreForTests()
    const store = getRateLimitStore()

    const first = await store.increment('test-key', 60_000)
    const second = await store.increment('test-key', 60_000)

    expect(first.count).toBe(1)
    expect(second.count).toBe(2)
    expect(second.resetAt).toBeGreaterThan(Date.now())
  })

  it('resets count after window expires', async () => {
    resetRateLimitStoreForTests()
    const store = getRateLimitStore()

    await store.increment('short-key', 1)
    await new Promise(resolve => setTimeout(resolve, 5))
    const again = await store.increment('short-key', 1)

    expect(again.count).toBe(1)
  })
})
