// ANCHOR: OAuth verifier exchange on post-login landing
import { NEON_AUTH_SESSION_VERIFIER_PARAM } from '#shared/auth'

export default defineNuxtPlugin({
  name: 'auth-oauth',
  async setup() {
    const route = useRoute()
    const verifier = route.query[NEON_AUTH_SESSION_VERIFIER_PARAM]
    if (typeof verifier !== 'string' || !verifier) return

    try {
      await $fetch('/api/auth/get-session', {
        query: { [NEON_AUTH_SESSION_VERIFIER_PARAM]: verifier },
        credentials: 'include'
      })
    } catch {
      await navigateTo('/auth/login?error=oauth')
      return
    }

    const query = { ...route.query }
    delete query[NEON_AUTH_SESSION_VERIFIER_PARAM]
    await navigateTo({ path: route.path, query }, { replace: true })
  }
})
