// ANCHOR: SSR fetch forwarding request cookies
export function useApiFetch(): typeof $fetch {
  if (import.meta.server) {
    return useRequestFetch() as typeof $fetch
  }
  return $fetch
}
