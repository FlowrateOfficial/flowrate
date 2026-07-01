// ANCHOR: OAuth verifier query param (Neon redirect)
export const NEON_AUTH_SESSION_VERIFIER_PARAM = 'neon_auth_session_verifier'

export const OAUTH_PROVIDERS = ['google', 'github'] as const
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]
