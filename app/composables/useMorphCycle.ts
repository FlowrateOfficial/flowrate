export function useMorphCycle<T>(items: Ref<T[]> | ComputedRef<T[]>, intervalMs = 3400) {
  const index = ref(0)
  const current = computed(() => items.value[index.value % Math.max(items.value.length, 1)])

  let timer: ReturnType<typeof setInterval> | null = null

  function start() {
    stop()
    if (!import.meta.client) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (items.value.length < 2) return

    timer = setInterval(() => {
      index.value = (index.value + 1) % items.value.length
    }, intervalMs)
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function pick(i: number) {
    index.value = i
    start()
  }

  onMounted(start)
  onUnmounted(stop)

  watch(items, () => {
    if (index.value >= items.value.length) index.value = 0
    start()
  })

  return { index, current, pick, start, stop }
}
