// ANCHOR: Dashboard breadcrumbs from path segments
export interface BreadcrumbItem {
  label: string
  to?: string
}

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
  feedback: 'dashboard.feedback.title',
  admin: 'nav.admin',
  onboarding: 'dashboard.onboarding.welcome',
  invite: 'breadcrumbs.invitation'
}

// NOTE - Prefix-only routes with no index page
const DASHBOARD_PREFIX_ONLY = new Set(['admin'])

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

    if (path === '/privacy' || path === '/terms' || path === '/glba') {
      const root: BreadcrumbItem = isLoggedIn.value
        ? { label: t('nav.overview'), to: '/dashboard' }
        : { label: t('common.appName'), to: '/' }
      const titleKey = path === '/privacy'
        ? 'legal.privacy.title'
        : path === '/terms'
          ? 'legal.terms.title'
          : 'legal.glba.title'
      return [
        root,
        { label: t(titleKey) }
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
        const shouldLink = !isLast && !DASHBOARD_PREFIX_ONLY.has(part)
        crumbs.push({
          label: t(segmentKey),
          to: shouldLink ? acc : undefined
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
