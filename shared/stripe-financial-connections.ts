// ANCHOR: Stripe Financial Connections — shared server/client config
// NOTE - Stripe docs country list = where your business may operate; session filters.countries = linked banks (US only)
export const FINANCIAL_CONNECTIONS_DOCS_URL = 'https://docs.stripe.com/financial-connections'

export const FINANCIAL_CONNECTIONS_BUSINESS_COUNTRIES = [
  'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GI',
  'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MT', 'NL', 'NO',
  'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'US'
] as const

export type FinancialConnectionsBusinessCountry
  = (typeof FINANCIAL_CONNECTIONS_BUSINESS_COUNTRIES)[number]

export const FINANCIAL_CONNECTIONS_BANK_COUNTRIES = ['US'] as const

export type FinancialConnectionsBankCountry
  = (typeof FINANCIAL_CONNECTIONS_BANK_COUNTRIES)[number]

export const FINANCIAL_CONNECTIONS_PERMISSIONS = ['balances', 'transactions'] as const

export const FINANCIAL_CONNECTIONS_PREFETCH = ['balances', 'transactions'] as const

export function isFinancialConnectionsBusinessCountry(
  code: string
): code is FinancialConnectionsBusinessCountry {
  return (FINANCIAL_CONNECTIONS_BUSINESS_COUNTRIES as readonly string[]).includes(code.toUpperCase())
}
