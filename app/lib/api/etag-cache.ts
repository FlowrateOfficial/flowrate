// ANCHOR: Client-side ETag cache for conditional GET requests
const MAX_ENTRIES = 128

interface EtagEntry {
  etag: string
  data: unknown
}

const store = new Map<string, EtagEntry>()

export function getEtagEntry(key: string): EtagEntry | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  // NOTE - LRU touch
  store.delete(key)
  store.set(key, entry)
  return entry
}

export function setEtagEntry(key: string, etag: string, data: unknown) {
  if (store.size >= MAX_ENTRIES && !store.has(key)) {
    const oldest = store.keys().next().value
    if (oldest) store.delete(oldest)
  }
  store.set(key, { etag, data })
}

export function clearEtagEntry(key: string) {
  store.delete(key)
}

export function clearEtagStore() {
  store.clear()
}

/** Drop cached GETs whose key contains a fragment (e.g. space id or route path). */
export function clearEtagEntriesMatching(matcher: string | ((key: string) => boolean)) {
  const test = typeof matcher === 'string'
    ? (key: string) => key.includes(matcher)
    : matcher

  for (const key of [...store.keys()]) {
    if (test(key)) store.delete(key)
  }
}
