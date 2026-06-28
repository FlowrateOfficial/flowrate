/** Redirect authenticated users away from marketing and auth pages. */
export default defineNuxtRouteMiddleware(async () => {
  const { getSession } = useNeonAuth()
  const session = await getSession()

  if (session?.user?.id) {
    return navigateTo('/dashboard')
  }
})
