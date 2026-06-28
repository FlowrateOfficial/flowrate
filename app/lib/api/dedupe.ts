const inflight = new Map<string, Promise<unknown>>()

export function dedupeRequest<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>

  const promise = run().finally(() => {
    inflight.delete(key)
  })

  inflight.set(key, promise)
  return promise
}

export function buildRequestKey(
  method: string,
  url: string,
  spaceId: string | null | undefined,
  query?: Record<string, unknown>
): string {
  const queryKey = query ? JSON.stringify(query, Object.keys(query).sort()) : ''
  return `${method}:${url}:${spaceId ?? ''}:${queryKey}`
}
