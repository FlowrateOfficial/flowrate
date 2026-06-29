// NOTE - ANCHOR: SSR-safe fetch — forwards incoming request cookies (plain $fetch does not)
export function useApiFetch(): typeof $fetch {
  if (import.meta.server) {
    return useRequestFetch() as typeof $fetch
  }
  return $fetch
}
