import {
  createPlaidLinkToken,
  requirePlaid,
  throwPlaidError
} from '../../lib/plaid'
import { assertCanConnectBank } from '../../lib/billing/enforcement'
import { PLAID_COUNTRY_CODES, PLAID_DOCS_URL, PLAID_OAUTH_RETURN_PATH } from '#shared/plaid-config'

export default defineEventHandler(async (event) => {
  const { user } = await requireSpaceAccess(event)

  await assertCanConnectBank(user.id)

  try {
    const { config, client, env } = requirePlaid(event)
    const locale = getHeader(event, 'accept-language')?.split(',')[0]

    const redirectUri = String(config.plaidRedirectUri ?? '').trim()
      || null
    const webhook = String(config.plaidWebhookUrl ?? '').trim() || null

    const linkToken = await createPlaidLinkToken(client, event, {
      userId: user.id,
      locale,
      redirectUri,
      webhook,
      env
    })

    return {
      linkToken: linkToken.link_token,
      expiration: linkToken.expiration,
      countryCodes: [...PLAID_COUNTRY_CODES],
      docsUrl: PLAID_DOCS_URL,
      env,
      oauthReturnPath: PLAID_OAUTH_RETURN_PATH,
      oauthEnabled: Boolean(redirectUri)
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    console.error('[plaid/link-token]', error)
    throwPlaidError(error, 'Could not create Plaid Link token')
  }
})
