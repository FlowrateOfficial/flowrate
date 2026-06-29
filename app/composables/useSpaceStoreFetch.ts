// ANCHOR: Page bootstrap — refetch store when space (or deps) change
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
      watch: [spaceId, ...extraWatch.map(source => () => toValue(source))]
    }
  )
}
