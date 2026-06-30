import { OAUTH_PROVIDERS, type OAuthProvider } from './auth'

// NOTE - sign-in OTP works for all auth methods; forget-password fails for OAuth-only accounts
export const ACCOUNT_DELETE_EMAIL_OTP_TYPE = 'sign-in' as const

export interface AccountDeleteChallenge {
  email: string
  requiresPassword: boolean
  oauthProviders: OAuthProvider[]
  hasVerifiedPhone: boolean
  phoneHint: string | null
}

export interface AccountDeleteRequest {
  confirmEmail: string
  emailCode: string
  phoneCode?: string
  password?: string
}

const CREDENTIAL_PROVIDER_IDS = new Set(['credential', 'email', 'password'])

export function maskPhoneHint(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return phone
  return `•••• ${digits.slice(-4)}`
}

export function resolveAccountDeleteAuthRequirements(providerIds: string[]): {
  oauthProviders: OAuthProvider[]
  requiresPassword: boolean
} {
  const oauthProviders = OAUTH_PROVIDERS.filter(provider => providerIds.includes(provider))
  const hasCredential = providerIds.some(id => CREDENTIAL_PROVIDER_IDS.has(id))
  return {
    oauthProviders,
    // NOTE - OAuth-linked accounts use admin delete; password only for email/password-only sign-in
    requiresPassword: hasCredential && oauthProviders.length === 0
  }
}
