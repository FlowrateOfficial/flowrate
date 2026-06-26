/**
 * Same-origin API fetch that forwards cookies during SSR.
 * Plain $fetch on the server does not include the incoming request cookies.
 */
export function useApiFetch() {
  if (import.meta.server) {
    return useRequestFetch()
  }
  return $fetch
}
