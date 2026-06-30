// ANCHOR: Client-side ETag cache for conditional GET requests
const MAX_ENTRIES = 64

interface EtagEntry {
  etag: string
  data: unknown
}

const store = new Map<string, EtagEntry>()

export function getEtagEntry(key: string): EtagEntry | undefined {
  return store.get(key)
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
