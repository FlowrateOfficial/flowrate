export const MOBILE_NAV_SLOT_COUNT = 4

/** Sensible mobile defaults when the user has not customized footer tabs */
export const DEFAULT_MOBILE_NAV_ORDER = [
  '/dashboard',
  '/dashboard/transactions',
  '/dashboard/subscriptions',
  '/dashboard/budgets'
] as const

export interface MobileNavLink {
  to: string
  icon: string
  label: string
}

function storageKey(userId: string | undefined) {
  return userId ? `flowrate-mobile-nav:${userId}` : 'flowrate-mobile-nav:guest'
}

function readSavedOrder(userId: string | undefined): string[] | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return null
  }
}

function writeSavedOrder(userId: string | undefined, order: string[]) {
  if (!import.meta.client) return
  localStorage.setItem(storageKey(userId), JSON.stringify(order))
}

export function resolveMobileNavOrder(
  saved: string[] | null,
  available: MobileNavLink[],
  slotCount = MOBILE_NAV_SLOT_COUNT
): string[] {
  const pool = new Map(available.map(item => [item.to, item]))
  const result: string[] = []
  const seed = saved ?? [...DEFAULT_MOBILE_NAV_ORDER]

  for (const to of seed) {
    if (pool.has(to) && !result.includes(to)) result.push(to)
    if (result.length >= slotCount) break
  }

  for (const item of available) {
    if (result.length >= slotCount) break
    if (!result.includes(item.to)) result.push(item.to)
  }

  return result.slice(0, slotCount)
}

export function useMobileNavLayout() {
  const userStore = useUserStore()
  const { navItems, bottomItems, user } = storeToRefs(userStore)

  const savedOrder = useState<string[] | null>('mobile-nav-order', () => null)

  const availableItems = computed<MobileNavLink[]>(() => {
    const seen = new Set<string>()
    const items: MobileNavLink[] = []

    const dashboardExtras = userStore.getAccountMenuLinks().filter(
      item => item.to.startsWith('/dashboard') && item.to !== '/dashboard/settings'
    )

    for (const item of [...navItems.value, ...bottomItems.value, ...dashboardExtras]) {
      if (seen.has(item.to)) continue
      seen.add(item.to)
      items.push(item)
    }

    return items
  })

  const order = computed(() =>
    resolveMobileNavOrder(savedOrder.value, availableItems.value)
  )

  const footerPaths = computed(() => new Set(order.value))

  const footerItems = computed(() =>
    order.value
      .map(to => availableItems.value.find(item => item.to === to))
      .filter((item): item is MobileNavLink => Boolean(item))
  )

  function hydrateOrder() {
    savedOrder.value = readSavedOrder(user.value?.id)
  }

  function setOrder(next: string[]) {
    const resolved = resolveMobileNavOrder(next, availableItems.value)
    savedOrder.value = resolved
    writeSavedOrder(user.value?.id, resolved)
  }

  function resetOrder() {
    savedOrder.value = null
    if (import.meta.client) {
      localStorage.removeItem(storageKey(user.value?.id))
    }
  }

  function moveItem(index: number, direction: -1 | 1) {
    const next = [...order.value]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const current = next[index]!
    next[index] = next[target]!
    next[target] = current
    setOrder(next)
  }

  function replaceItem(index: number, to: string) {
    const next = [...order.value]
    if (!availableItems.value.some(item => item.to === to)) return

    const existingIndex = next.indexOf(to)
    if (existingIndex >= 0 && existingIndex !== index) {
      next[existingIndex] = next[index]!
    }

    next[index] = to
    setOrder(next)
  }

  watch(
    () => user.value?.id,
    () => hydrateOrder(),
    { immediate: true }
  )

  watch(availableItems, () => {
    if (savedOrder.value) {
      setOrder(savedOrder.value)
    }
  })

  return {
    order,
    footerItems,
    footerPaths,
    availableItems,
    setOrder,
    resetOrder,
    moveItem,
    replaceItem,
    hydrateOrder
  }
}
