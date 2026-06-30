import { processPlaidWebhook } from '../../lib/services/plaid-webhook.service'
import { getPlaidClient } from '../../lib/plaid/client'
import { normalizePlaidEnv } from '#shared/plaid-config'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.plaidClientId || !config.plaidSecret) {
    throw createError({ statusCode: 503, message: 'Plaid is not configured' })
  }

  const body = await readRawBody(event)
  if (!body) {
    throw createError({ statusCode: 400, message: 'Missing webhook body' })
  }

  let payload
  try {
    payload = JSON.parse(body.toString())
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid webhook JSON' })
  }

  const client = getPlaidClient(
    config.plaidClientId,
    config.plaidSecret,
    normalizePlaidEnv(config.plaidEnv)
  )

  return processPlaidWebhook(client, payload)
})
