// ANCHOR: Pinia fetch helpers — dedupe, space scope, money fmt

// NOTE - Same cache key reuses one in-flight promise
export function createStoreFetch() {
  let inflightKey = ''
  let inflight: Promise<unknown> | null = null

  return async function fetchOnce<T>(key: string, fn: () => Promise<T>, force = false): Promise<T> {
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
}

export interface SpaceScopedLoaderOptions<T> {
  buildKey: (spaceId: string) => string
  fetch: (spaceId: string) => Promise<T>
  apply: (data: T) => void
  clear: () => void
  isCached?: (key: string) => boolean
}

// NOTE - load/clear per space; pending ref; auto-reset on space switch
export function createSpaceScopedLoader<T>(options: SpaceScopedLoaderOptions<T>) {
  const fetchOnce = createStoreFetch()
  const pending = ref(false)
  let lastKey = ''

  async function load(force = false) {
    const spaceId = useSpacesStore().space?.id
    if (!spaceId) return

    const key = options.buildKey(spaceId)
    return fetchOnce(key, async () => {
      if (!force && lastKey === key && options.isCached?.(key)) return

      pending.value = true
      try {
        options.apply(await options.fetch(spaceId))
        lastKey = key
      } finally {
        pending.value = false
      }
    }, force)
  }

  function reset() {
    lastKey = ''
    options.clear()
  }

  // NOTE - Pre-fill from composite endpoints (e.g. dashboard overview)
  function seed(data: T, key?: string) {
    options.apply(data)
    const spaceId = useSpacesStore().space?.id
    lastKey = key ?? (spaceId ? options.buildKey(spaceId) : '')
  }

  watch(() => useSpacesStore().space?.id, (id, prev) => {
    if (id !== prev) reset()
  })

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
