// ANCHOR: Neon Auth composable for client sign-in
import { getAuthClient, resetAuthClient } from '~/lib/auth-client'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

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
    return auth.signUp.email({ email, password, name: `${name ?? email.split('@')[0]}` })
  }

  async function signOut() {
    if (!import.meta.client) return

    resetAuthClient()

    try {
      await $fetch('/api/auth/sign-out', {
        method: 'POST',
        body: {},
        credentials: 'include'
      })
    } catch {
      // NOTE - Sign-out may already have cleared session
    }
  }

  async function getSession() {
    try {
      if (import.meta.server) {
        const { api } = useApi()
        return await api<{ user?: { id: string; email?: string; name?: string | null } | null; session?: unknown }>(
          apiRoutes.auth.session,
          { noSpace: true }
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

  async function verifyEmailOtp(email: string, otp: string) {
    const auth = getAuthClient()
    if (!auth) throw new Error('Auth is only available in the browser')
    return auth.emailOtp.verifyEmail({ email, otp })
  }

  async function sendEmailVerificationOtp(email: string) {
    const auth = getAuthClient()
    if (!auth) throw new Error('Auth is only available in the browser')
    return auth.emailOtp.sendVerificationOtp({
      email,
      type: 'email-verification'
    })
  }

  return {
    isConfigured,
    signIn,
    signUp,
    signOut,
    getSession,
    requestPasswordReset,
    verifyEmailOtp,
    sendEmailVerificationOtp
  }
}
