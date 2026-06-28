// NOTE - ANCHOR: SSR-safe fetch — forwards incoming request cookies (plain $fetch does not)
export function useApiFetch() {
  if (import.meta.server) {
    return useRequestFetch()
  }
  return $fetch
}
