// ANCHOR: Pinia loaders — dedupe, space scope, money fmt
import { clearEtagEntriesMatching, clearEtagStore } from '~/lib/api/etag-cache'

// NOTE - dedupe in-flight by cache key
export function createStoreFetch() {
  let inflightKey = ''
  let inflight: Promise<unknown> | null = null

  async function fetchOnce<T>(key: string, fn: () => Promise<T>, force = false): Promise<T> {
    if (!force && inflight && inflightKey === key) {
      return inflight as Promise<T>
    }
    inflightKey = key
    const promise = fn().finally(() => {
      if (inflight === promise) {
        inflight = null
        inflightKey = ''
      }
    })
    inflight = promise
    return promise
  }

  function cancelInflight() {
    inflight = null
    inflightKey = ''
  }

  return { fetchOnce, cancelInflight }
}

export interface SpaceScopedLoaderOptions<T> {
  buildKey: (spaceId: string) => string
  fetch: (spaceId: string) => Promise<T>
  apply: (data: T) => void
  clear: () => void
  isCached?: (key: string) => boolean
  /** When force=true, only bust ETag keys matching this (defaults to full clear). */
  etagBust?: (spaceId: string) => string
}

// NOTE - per-space load; reset on space switch
export function createSpaceScopedLoader<T>(options: SpaceScopedLoaderOptions<T>) {
  const { fetchOnce, cancelInflight } = createStoreFetch()
  const pending = ref(false)
  let lastKey = ''
  let loadGeneration = 0

  async function load(force = false) {
    const spaceId = useSpacesStore().space?.id
    if (!spaceId) return

    const key = options.buildKey(spaceId)
    const generation = loadGeneration
    return fetchOnce(key, async () => {
      if (force) {
        const bust = options.etagBust?.(spaceId)
        if (bust) clearEtagEntriesMatching(bust)
        else clearEtagStore()
      }
      if (!force && lastKey === key && options.isCached?.(key)) return

      pending.value = true
      try {
        const data = await options.fetch(spaceId)
        if (generation !== loadGeneration) return
        if (useSpacesStore().space?.id !== spaceId) return
        options.apply(data)
        lastKey = key
      } finally {
        if (generation === loadGeneration) pending.value = false
      }
    }, force)
  }

  function reset() {
    loadGeneration += 1
    lastKey = ''
    pending.value = false
    cancelInflight()
    options.clear()
  }

  // NOTE - seed from dashboard overview
  function seed(data: T, key?: string) {
    options.apply(data)
    const spaceId = useSpacesStore().space?.id
    lastKey = key ?? (spaceId ? options.buildKey(spaceId) : '')
  }

  watch(() => useSpacesStore().space?.id, (id, prev) => {
    if (id !== prev) reset()
  }, { flush: 'sync' })

  return { pending, load, reset, seed }
}

// NOTE - Pick currency from row set when caller omits it
export function storeMoneyFormatter(
  formatCurrency: (amount: number, currency?: string) => string,
  resolveCurrency: (items: Array<{ currency?: string | null }>) => string
) {
  return (amount: number, items: Array<{ currency?: string | null }> = [], currency?: string) =>
    formatCurrency(amount, currency ?? resolveCurrency(items))
}
