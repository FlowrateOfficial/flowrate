// ANCHOR: Plaid SDK client
import type { H3Event } from 'h3'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { normalizePlaidEnv, type PlaidEnv } from '#shared/plaid-config'

export type { PlaidEnv }

function plaidEnvironment(env: PlaidEnv): string {
  return env === 'production'
    ? (PlaidEnvironments.production ?? 'https://production.plaid.com')
    : (PlaidEnvironments.sandbox ?? 'https://sandbox.plaid.com')
}

export function getPlaidClient(clientId: string, secret: string, env: PlaidEnv): PlaidApi {
  const configuration = new Configuration({
    basePath: plaidEnvironment(env),
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': clientId,
        'PLAID-SECRET': secret
      }
    }
  })
  return new PlaidApi(configuration)
}

export function requirePlaid(event: H3Event) {
  const config = useRuntimeConfig(event)
  const clientId = config.plaidClientId
  const secret = config.plaidSecret
  const env = normalizePlaidEnv(config.plaidEnv)

  if (!clientId || !secret) {
    throw createError({
      statusCode: 503,
      message: 'Plaid is not configured',
      data: { code: 'PLAID_NOT_CONFIGURED' }
    })
  }

  return {
    config,
    client: getPlaidClient(clientId, secret, env),
    env
  }
}

export function isPlaidConfigured(event: H3Event): boolean {
  const config = useRuntimeConfig(event)
  return Boolean(config.plaidClientId && config.plaidSecret)
}
