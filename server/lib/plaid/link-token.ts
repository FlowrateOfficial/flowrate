// ANCHOR: Plaid Link token creation
import type { H3Event } from 'h3'
import type { PlaidApi } from 'plaid'
import { CountryCode, Products } from 'plaid'
import { PLAID_COUNTRY_CODES } from '#shared/plaid-config'
import type { PlaidEnv } from './client'

const COUNTRY_MAP: Record<string, CountryCode> = {
  FR: CountryCode.Fr,
  DE: CountryCode.De,
  ES: CountryCode.Es,
  IT: CountryCode.It,
  NL: CountryCode.Nl,
  BE: CountryCode.Be,
  GB: CountryCode.Gb,
  IE: CountryCode.Ie,
  PT: CountryCode.Pt,
  AT: CountryCode.At,
  FI: CountryCode.Fi,
  PL: CountryCode.Pl,
  DK: CountryCode.Dk,
  NO: CountryCode.No,
  SE: CountryCode.Se
}

export async function createPlaidLinkToken(
  client: PlaidApi,
  _event: H3Event,
  options: {
    userId: string
    locale?: string
    redirectUri?: string | null
    webhook?: string | null
    env?: PlaidEnv
  }
) {
  const language = options.locale?.startsWith('fr') ? 'fr' : 'en'
  const countryCodes = PLAID_COUNTRY_CODES
    .map(code => COUNTRY_MAP[code])
    .filter((code): code is CountryCode => Boolean(code))

  const response = await client.linkTokenCreate({
    user: { client_user_id: options.userId },
    client_name: 'FlowRate',
    products: [Products.Transactions],
    country_codes: countryCodes,
    language,
    // NOTE - OAuth redirect_uri must be registered in Plaid Dashboard
    // NOTE - Omit on local HTTP so sandbox non-OAuth banks work
    ...(options.redirectUri ? { redirect_uri: options.redirectUri } : {}),
    ...(options.webhook ? { webhook: options.webhook } : {})
  })

  return response.data
}
