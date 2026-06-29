// ANCHOR: Redirect authenticated users off auth pages
export default defineNuxtRouteMiddleware(async (to) => {
  const { getSession } = useNeonAuth()
  const session = await getSession()

  if (!session?.user?.id) return

  const emailVerified = (session.user as { emailVerified?: boolean }).emailVerified
  if (emailVerified === false && to.path === '/auth/verify-email') {
    return
  }

  if (emailVerified === false) {
    return navigateTo({
      path: '/auth/verify-email',
      query: { email: session.user.email ?? '' }
    })
  }

  return navigateTo('/dashboard')
})
