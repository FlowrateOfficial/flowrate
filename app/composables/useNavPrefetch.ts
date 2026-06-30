// ANCHOR: Prefetch dashboard data on nav hover for near-instant page opens
const prefetched = new Set<string>()

export function useNavPrefetch() {
  function prefetchRoute(to: string) {
    if (!import.meta.client) return
    const path = to.split('?')[0]!
    if (prefetched.has(path)) return
    prefetched.add(path)

    const dashboard = useDashboardStore()
    const accounts = useAccountsStore()
    const transactions = useTransactionsStore()
    const budgets = useBudgetsStore()
    const subscriptions = useSubscriptionsStore()
    const goals = useSavingsGoalsStore()
    const business = useBusinessStore()
    const family = useFamilyStore()

    if (path === '/dashboard' || path === '/dashboard/analytics') {
      void dashboard.fetchOverview()
      return
    }
    if (path === '/dashboard/accounts') {
      void accounts.fetchAccounts()
      return
    }
    if (path === '/dashboard/transactions') {
      if (!transactions.items.length) void transactions.resetAndFetch()
      if (!accounts.accounts.length) void accounts.fetchAccounts()
      return
    }
    if (path === '/dashboard/budgets') {
      void budgets.fetchBudgets()
      return
    }
    if (path === '/dashboard/subscriptions') {
      void subscriptions.fetchSubscriptions()
      void subscriptions.fetchCalendar()
      return
    }
    if (path === '/dashboard/goals') {
      void goals.fetchGoals()
      return
    }
    if (path === '/dashboard/company' || path.startsWith('/dashboard/company')) {
      void business.fetchOverview()
      return
    }
    if (path === '/dashboard/family') {
      void family.loadSpaceDetail()
    }
  }

  function onNavHover(to: string) {
    prefetchRoute(to)
  }

  watch(() => useSpacesStore().space?.id, () => {
    prefetched.clear()
  })

  return { prefetchRoute, onNavHover }
}
