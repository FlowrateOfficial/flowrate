// ANCHOR: refetch stores on space change (lazy client)
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

export function useSpaceStoreFetch(
  keyPrefix: string,
  fetcher: () => Promise<unknown>,
  extraWatch: MaybeRefOrGetter<unknown>[] = []
) {
  const spacesStore = useSpacesStore()
  const spaceId = computed(() => spacesStore.space?.id)

  return useAsyncData(
    () => `${keyPrefix}-${spaceId.value ?? 'none'}`,
    async () => {
      await fetcher()
      return null
    },
    {
      watch: [spaceId, ...extraWatch.map(source => () => toValue(source))],
      // NOTE - render fast; stores show pending
      lazy: import.meta.client,
      dedupe: 'defer'
    }
  )
}
