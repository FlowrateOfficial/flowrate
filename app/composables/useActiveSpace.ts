import { storeToRefs } from 'pinia'

/** @deprecated Prefer useSpacesStore() directly */
export function useActiveSpace() {
  const store = useSpacesStore()
  const refs = storeToRefs(store)
  return {
    ...refs,
    fetchSpaces: store.fetchSpaces,
    switchSpace: store.switchSpace,
    spaceQuery: store.spaceQuery,
    spaceHeaders: store.spaceHeaders
  }
}
