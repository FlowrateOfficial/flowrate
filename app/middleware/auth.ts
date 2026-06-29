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
  const verifier = to.query[NEON_AUTH_SESSION_VERIFIER_PARAM]

  if (verifier && import.meta.server) {
    return
  }

  const { getSession } = useNeonAuth()
  const session = await getSession()

  if (!session?.user?.id) {
    return navigateTo('/auth/login')
  }

  const userStore = useUserStore()

  try {
    if (!userStore.bootstrapped) {
      await userStore.bootstrap()
    }
  } catch {
    return navigateTo('/auth/login')
  }

  const spacesStore = useSpacesStore()

  if (import.meta.server || !spacesStore.spaces.length) {
    try {
      await spacesStore.fetchSpaces()
    } catch {
      return navigateTo('/auth/login')
    }
  }

  if (!userStore.user) {
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
