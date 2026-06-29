// ANCHOR: Chart.js colors for light and dark themes
export function useChartTheme() {
  // NOTE - color-mode undefined until plugin init on SSR
  const colorModeState = useState<{ value: string } | undefined>('color-mode')
  const isDark = computed(() => (colorModeState.value?.value ?? 'light') === 'dark')

  const text = computed(() => (isDark.value ? '#9C968D' : '#67635E'))
  const textBright = computed(() => (isDark.value ? '#B5AFA6' : '#67635E'))
  const grid = computed(() =>
    isDark.value ? 'rgba(237, 234, 228, 0.055)' : 'rgba(25, 25, 25, 0.05)'
  )
  const gridStrong = computed(() =>
    isDark.value ? 'rgba(237, 234, 228, 0.08)' : 'rgba(0, 0, 0, 0.06)'
  )
  const surface = computed(() => (isDark.value ? '#1A1917' : '#FCFBF8'))
  const fillInk = computed(() =>
    isDark.value ? 'rgba(237, 234, 228, 0.07)' : 'rgba(42, 42, 42, 0.06)'
  )

  const sage = computed(() => (isDark.value ? '#91A891' : '#7A8F7A'))
  const terracotta = computed(() => (isDark.value ? '#D4845F' : '#C46F4A'))
  const sand = computed(() => (isDark.value ? '#C9B896' : '#D8C7AA'))

  const palette = computed(() =>
    isDark.value
      ? ['#91A891', '#D4845F', '#C9B896', '#9C968D', '#8FB87A', '#D4A84F', '#EDEAE4', '#6B6560']
      : ['#7A8F7A', '#C46F4A', '#D8C7AA', '#67635E', '#7FA26A', '#C59B4B', '#2A2A2A', '#A39E97']
  )

  const incomeLine = computed(() => ({
    border: sage.value,
    fill: isDark.value ? 'rgba(145, 168, 145, 0.12)' : 'rgba(122, 143, 122, 0.05)'
  }))

  const spendingLine = computed(() => ({
    border: terracotta.value,
    fill: isDark.value ? 'rgba(212, 132, 95, 0.12)' : 'rgba(196, 111, 74, 0.05)'
  }))

  return {
    isDark,
    text,
    textBright,
    grid,
    gridStrong,
    surface,
    fillInk,
    sage,
    terracotta,
    sand,
    palette,
    incomeLine,
    spendingLine
  }
}
