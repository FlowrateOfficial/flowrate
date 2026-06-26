import { NEON_AUTH_SESSION_VERIFIER_PARAM } from '../../shared/auth'

// Protects /dashboard/* — session from cookies; OAuth verifier exchanged by server middleware.
export default defineNuxtRouteMiddleware(async (to) => {
  const verifier = to.query[NEON_AUTH_SESSION_VERIFIER_PARAM]

  // Server: neon-auth.ts middleware exchanges verifier → redirect. If still present, defer to client.
  if (verifier && import.meta.server) {
    return
  }

  const { getSession } = useNeonAuth()
  const session = await getSession()

  if (!session?.user?.id) {
    return navigateTo('/auth/login')
  }

  const api = useApiFetch()

  // Provision Prisma user + default space on first dashboard visit
  try {
    await api('/api/user/bootstrap')
  } catch {
    return navigateTo('/auth/login')
  }

  const { fetchSpaces, activeSpace, isTeenView, spaces } = useActiveSpace()

  try {
    await fetchSpaces()
  } catch {
    return navigateTo('/auth/login')
  }

  if (isTeenView.value && !to.path.startsWith('/dashboard/teen')) {
    return navigateTo('/dashboard/teen')
  }

  if (!isTeenView.value && to.path.startsWith('/dashboard/teen')) {
    return navigateTo('/dashboard')
  }

  if (to.path === '/dashboard/onboarding' && activeSpace.value) {
    const hasMultiple = spaces.value.length > 1
    if (hasMultiple) return navigateTo('/dashboard')
  }
})
