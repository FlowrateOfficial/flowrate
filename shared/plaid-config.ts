// ANCHOR: Plaid Link — shared EU bank connection config
// NOTE - Dashboard: sandbox, keys, OAuth redirect URLs
// NOTE - https://dashboard.plaid.com/developers/sandbox
// NOTE - https://dashboard.plaid.com/developers/keys
// NOTE - https://dashboard.plaid.com/team/api
export const PLAID_DOCS_URL = 'https://plaid.com/docs/'
export const PLAID_SANDBOX_URL = 'https://dashboard.plaid.com/developers/sandbox'

// NOTE - EU Plaid Link markets (ISO-3166-1 alpha-2)
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
