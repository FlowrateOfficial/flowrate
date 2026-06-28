/**
 * Stripe Financial Connections configuration shared by server and client.
 *
 * @see https://docs.stripe.com/financial-connections
 * @see https://docs.stripe.com/financial-connections/fundamentals
 *
 * The long country list on Stripe's availability page is where **your business**
 * may operate — not which bank countries end users can link. Session
 * `filters.countries` controls linked institution geography; Stripe currently
 * supports US financial institutions only.
 */
export const FINANCIAL_CONNECTIONS_DOCS_URL = 'https://docs.stripe.com/financial-connections'

/** ISO 3166-1 alpha-2 codes where Stripe businesses may use Financial Connections. */
export const FINANCIAL_CONNECTIONS_BUSINESS_COUNTRIES = [
  'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GI',
  'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MT', 'NL', 'NO',
  'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'US'
] as const

export type FinancialConnectionsBusinessCountry =
  (typeof FINANCIAL_CONNECTIONS_BUSINESS_COUNTRIES)[number]

/** Bank institution countries users can link in a Financial Connections Session. */
export const FINANCIAL_CONNECTIONS_BANK_COUNTRIES = ['US'] as const

export type FinancialConnectionsBankCountry =
  (typeof FINANCIAL_CONNECTIONS_BANK_COUNTRIES)[number]

/** Data permissions for personal-finance / data-product use cases. */
export const FINANCIAL_CONNECTIONS_PERMISSIONS = ['balances', 'transactions'] as const

/** Prefetch balances and transactions when accounts are first linked. */
export const FINANCIAL_CONNECTIONS_PREFETCH = ['balances', 'transactions'] as const

export function isFinancialConnectionsBusinessCountry(
  code: string
): code is FinancialConnectionsBusinessCountry {
  return (FINANCIAL_CONNECTIONS_BUSINESS_COUNTRIES as readonly string[]).includes(code.toUpperCase())
}
