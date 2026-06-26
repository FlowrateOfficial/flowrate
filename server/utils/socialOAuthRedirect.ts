import type { H3Event } from 'h3'
import { getSocialOAuthRedirectUrl } from '../utils/neonAuthProxy'

/**
 * Start OAuth: GET /auth/google?redirect=/dashboard
 * Sets challenge cookie on app origin, then 302 to Google/GitHub.
 */
export async function handleSocialOAuthRedirect(
  event: H3Event,
  provider: 'google' | 'github'
) {
  const config = useRuntimeConfig(event)
  if (!config.public.neonAuthConfigured) {
    return sendRedirect(event, '/auth/login?error=oauth', 302)
  }

  const query = getQuery(event)
  const redirectPath = typeof query.redirect === 'string' && query.redirect.startsWith('/')
    ? query.redirect
    : '/dashboard'
  const callbackURL = `${getRequestURL(event).origin}${redirectPath}`

  try {
    const url = await getSocialOAuthRedirectUrl(event, provider, callbackURL)
    return sendRedirect(event, url, 302)
  } catch (error) {
    if (import.meta.dev) {
      console.error(`[auth/${provider}] OAuth redirect failed:`, error)
    }
    return sendRedirect(event, '/auth/login?error=oauth', 302)
  }
}
