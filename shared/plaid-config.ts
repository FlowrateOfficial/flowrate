// ANCHOR: Plaid Link config (EU markets)
export const PLAID_DOCS_URL = 'https://plaid.com/docs/'
export const PLAID_SANDBOX_URL = 'https://dashboard.plaid.com/developers/sandbox'

// NOTE - EU Link country codes
export const PLAID_COUNTRY_CODES = [
  'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'GB', 'IE', 'PT', 'AT', 'FI', 'PL', 'DK', 'NO', 'SE'
] as const

export type PlaidCountryCode = (typeof PLAID_COUNTRY_CODES)[number]

export const PLAID_LINK_PRODUCTS = ['transactions'] as const

export const PLAID_OAUTH_RETURN_PATH = '/dashboard/accounts/plaid-oauth'

export type PlaidEnv = 'sandbox' | 'production'

export function normalizePlaidEnv(value?: string | null): PlaidEnv {
  return value === 'production' ? 'production' : 'sandbox'
}

export function isPlaidSandbox(env?: string | null): boolean {
  return normalizePlaidEnv(env) === 'sandbox'
}
