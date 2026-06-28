export interface BreadcrumbItem {
  label: string
  to?: string
}

/** Dashboard path segment → i18n key */
const DASHBOARD_SEGMENT_KEYS: Record<string, string> = {
  transactions: 'nav.transactions',
  accounts: 'nav.accounts',
  analytics: 'nav.analytics',
  budgets: 'nav.budgets',
  subscriptions: 'nav.subscriptions',
  family: 'nav.family',
  company: 'nav.business',
  teen: 'nav.myMoney',
  settings: 'common.settings',
  spaces: 'nav.spaces',
  onboarding: 'dashboard.onboarding.welcome',
  invite: 'breadcrumbs.invitation'
}

export function useBreadcrumbs() {
  const route = useRoute()
  const { t } = useAppI18n()
  const { isLoggedIn } = useSessionUser()
  const tailLabel = useState<string | null>('breadcrumb-tail', () => null)

  watch(() => route.fullPath, () => {
    tailLabel.value = null
  })

  function setBreadcrumbTail(label: string | null) {
    tailLabel.value = label
  }

  const items = computed((): BreadcrumbItem[] => {
    const path = route.path

    if (path === '/privacy' || path === '/terms') {
      const root: BreadcrumbItem = isLoggedIn.value
        ? { label: t('nav.overview'), to: '/dashboard' }
        : { label: t('common.appName'), to: '/' }
      return [
        root,
        { label: t(path === '/privacy' ? 'legal.privacy.title' : 'legal.terms.title') }
      ]
    }

    if (!path.startsWith('/dashboard')) {
      return []
    }

    if (path === '/dashboard') {
      return [{ label: t('nav.overview') }]
    }

    const crumbs: BreadcrumbItem[] = [
      { label: t('nav.overview'), to: '/dashboard' }
    ]

    const parts = path.replace(/^\/dashboard\/?/, '').split('/').filter(Boolean)
    let acc = '/dashboard'

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!
      acc += `/${part}`
      const isLast = i === parts.length - 1
      const segmentKey = DASHBOARD_SEGMENT_KEYS[part]

      if (segmentKey) {
        crumbs.push({
          label: t(segmentKey),
          to: isLast ? undefined : acc
        })
        continue
      }

      let label = tailLabel.value
      if (!label) {
        if (acc.includes('/family/')) {
          label = t('dashboard.family.childFallback')
        } else if (acc.includes('/invite/')) {
          label = t('breadcrumbs.invitation')
        } else if (route.meta.title) {
          label = String(route.meta.title)
        } else {
          label = part
        }
      }

      crumbs.push({
        label,
        to: isLast ? undefined : acc
      })
    }

    return crumbs
  })

  const show = computed(() => items.value.length > 1)

  return { items, show, setBreadcrumbTail }
}
