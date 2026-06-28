import { NEON_AUTH_SESSION_VERIFIER_PARAM } from '#shared/auth'

/** Routes a guardian-managed child (no own bank) may access. */
const CHILD_ALLOWED_PREFIXES = ['/dashboard/teen', '/dashboard/settings']

/** Routes a teen (own login + optional bank) may access. */
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

// Protects /dashboard/* — session from cookies; OAuth verifier exchanged by server middleware.
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
    await userStore.bootstrap()
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

  if (spacesStore.isChildManaged && !isAllowedPath(to.path, CHILD_ALLOWED_PREFIXES)) {
    return navigateTo('/dashboard/teen')
  }

  if (spacesStore.isTeenView && !isAllowedPath(to.path, TEEN_ALLOWED_PREFIXES)) {
    return navigateTo('/dashboard/teen')
  }

  if (!spacesStore.isMinor && to.path.startsWith('/dashboard/teen')) {
    return navigateTo('/dashboard')
  }

  if (to.path === '/dashboard/onboarding' && spacesStore.activeSpace) {
    const hasMultiple = spacesStore.spaces.length > 1
    if (hasMultiple) return navigateTo('/dashboard')
  }
})
