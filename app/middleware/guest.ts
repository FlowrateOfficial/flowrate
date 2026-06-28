// NOTE - ANCHOR: Guest middleware — redirect signed-in users away from marketing/auth pages
export default defineNuxtRouteMiddleware(async () => {
  const { getSession } = useNeonAuth()
  const session = await getSession()

  if (session?.user?.id) {
    return navigateTo('/dashboard')
  }
})
