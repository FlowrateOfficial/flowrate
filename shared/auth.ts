// ANCHOR: OAuth session verifier query param (Neon Auth redirect)
export const NEON_AUTH_SESSION_VERIFIER_PARAM = 'neon_auth_session_verifier'

export const OAUTH_PROVIDERS = ['google', 'github'] as const
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]

export function isOAuthProvider(value: string): value is OAuthProvider {
  return OAUTH_PROVIDERS.includes(value as OAuthProvider)
}
