// ANCHOR: Dashboard auth middleware — session, roles, route allowlists
import { NEON_AUTH_SESSION_VERIFIER_PARAM } from '#shared/auth'

// NOTE - Child routes: guardian-managed, no bank
const CHILD_ALLOWED_PREFIXES = ['/dashboard/teen', '/dashboard/settings']

// NOTE - Teen routes: own login, optional bank
const TEEN_ALLOWED_PREFIXES = [
  '/dashboard/teen',
  '/dashboard/accounts',
  '/dashboard/transactions',
  '/dashboard/analytics',
  '/dashboard/settings'
]

function isAllowedPath(path: string, prefixes: string[]) {
  return prefixes.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

// NOTE - Guards /dashboard/*; OAuth verifier handled server-side
export default defineNuxtRouteMiddleware(async (to) => {
  const isDashboard = to.path === '/dashboard' || to.path.startsWith('/dashboard/')

  if (isDashboard && import.meta.server) {
    return
  }

  const verifier = to.query[NEON_AUTH_SESSION_VERIFIER_PARAM]
  if (verifier && import.meta.server) {
    return
  }

  const userStore = useUserStore()
  const spacesStore = useSpacesStore()

  // NOTE - After first bootstrap, skip session round-trip on every navigation
  const sessionReady = userStore.bootstrapped && spacesStore.spaces.length > 0

  if (!sessionReady) {
    const { getSession } = useNeonAuth()
    const session = await getSession()

    if (!session?.user?.id) {
      return navigateTo('/auth/login')
    }

    try {
      await Promise.all([
        !userStore.bootstrapped ? userStore.bootstrap() : Promise.resolve(),
        !spacesStore.spaces.length ? spacesStore.fetchSpaces() : Promise.resolve(),
        !userStore.user ? userStore.fetchUser() : Promise.resolve()
      ])
    } catch {
      return navigateTo('/auth/login')
    }
  } else if (!userStore.user) {
    try {
      await userStore.fetchUser()
    } catch {
      // NOTE - Profile fetch failed; layout retries
    }
  }

  if (spacesStore.isChildManaged && !isAllowedPath(to.path, CHILD_ALLOWED_PREFIXES)) {
    return navigateTo('/dashboard/teen')
  }

  if (spacesStore.isTeenView && !isAllowedPath(to.path, TEEN_ALLOWED_PREFIXES)) {
    return navigateTo('/dashboard/teen')
  }

  if (!spacesStore.isMinor && to.path.startsWith('/dashboard/teen')) {
    return navigateTo('/dashboard')
  }

  if (to.path === '/dashboard/onboarding' && spacesStore.space) {
    const hasMultiple = spacesStore.spaces.length > 1
    if (hasMultiple) return navigateTo('/dashboard')
  }
})
