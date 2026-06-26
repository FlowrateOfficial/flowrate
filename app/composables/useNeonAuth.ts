/**
 * Client-side Neon Auth composable.
 *
 * Email/password and session use the SDK against /api/auth (proxied to Neon Auth).
 * Google/GitHub use server redirect routes (/auth/google, /auth/github).
 */
import { getAuthClient, resetAuthClient } from '~/lib/auth-client'

export function useNeonAuth() {
  const config = useRuntimeConfig()
  const isConfigured = computed(() => Boolean(config.public.neonAuthConfigured))

  async function signIn(email: string, password: string) {
    const auth = getAuthClient()
    if (!auth) throw new Error('Auth is only available in the browser')
    return auth.signIn.email({ email, password })
  }

  async function signUp(email: string, password: string, name?: string) {
    const auth = getAuthClient()
    if (!auth) throw new Error('Auth is only available in the browser')
    return auth.signUp.email({ email, password, name: name ?? email.split('@')[0] })
  }

  async function signOut() {
    if (!import.meta.client) return

    try {
      await $fetch('/api/auth/sign-out', {
        method: 'POST',
        body: {},
        credentials: 'include'
      })
    } finally {
      resetAuthClient()
    }
  }

  async function getSession() {
    const api = useApiFetch()
    try {
      if (import.meta.server) {
        return await api<{ user?: { id: string; email?: string; name?: string | null } | null; session?: unknown }>(
          '/api/auth/get-session'
        )
      }

      const auth = getAuthClient()
      if (!auth) return null
      const result = await auth.getSession()
      return result.data ?? null
    } catch {
      return null
    }
  }

  async function requestPasswordReset(email: string, redirectTo = '/auth/login') {
    const auth = getAuthClient()
    if (!auth) throw new Error('Auth is only available in the browser')
    return auth.requestPasswordReset({ email, redirectTo })
  }

  return {
    isConfigured,
    signIn,
    signUp,
    signOut,
    getSession,
    requestPasswordReset
  }
}
