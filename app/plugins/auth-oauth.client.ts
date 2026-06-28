// NOTE - ANCHOR: OAuth client plugin — exchange neon_auth_session_verifier on landing
import { NEON_AUTH_SESSION_VERIFIER_PARAM } from '#shared/auth'

export default defineNuxtPlugin(async () => {
  const route = useRoute()
  const verifier = route.query[NEON_AUTH_SESSION_VERIFIER_PARAM]
  if (typeof verifier !== 'string' || !verifier) return

  try {
    await $fetch('/api/auth/get-session', {
      query: { [NEON_AUTH_SESSION_VERIFIER_PARAM]: verifier },
      credentials: 'include'
    })
  } catch {
    return navigateTo('/auth/login?error=oauth')
  }

  const query = { ...route.query }
  delete query[NEON_AUTH_SESSION_VERIFIER_PARAM]
  await navigateTo({ path: route.path, query }, { replace: true })
})
