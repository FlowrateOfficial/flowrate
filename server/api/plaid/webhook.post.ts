import { syncPlaidLinkTransactions } from '../../lib/plaid'
import { getPlaidClient } from '../../lib/plaid/client'
import { normalizePlaidEnv } from '#shared/plaid-config'
import { allowsWebhookSync, userPlanForId } from '../../lib/billing/enforcement'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.plaidClientId || !config.plaidSecret) {
    throw createError({ statusCode: 503, message: 'Plaid is not configured' })
  }

  const body = await readRawBody(event)
  if (!body) {
    throw createError({ statusCode: 400, message: 'Missing webhook body' })
  }

  let payload: { webhook_type?: string, webhook_code?: string, item_id?: string }
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

  const { webhook_type: type, webhook_code: code, item_id: ref } = payload

  if (!ref) {
    return { received: true }
  }

  const link = await prisma.plaidLink.findUnique({ where: { ref } })
  if (!link) {
    return { received: true, ignored: true }
  }

  const plan = await userPlanForId(link.userId)
  if (!allowsWebhookSync(plan)) {
    return { received: true, skipped: 'free_plan' }
  }

  if (
    (type === 'TRANSACTIONS' && (code === 'SYNC_UPDATES_AVAILABLE' || code === 'DEFAULT_UPDATE'))
    || (type === 'ITEM' && code === 'NEW_ACCOUNTS_AVAILABLE')
  ) {
    try {
      await syncPlaidLinkTransactions(client, link.id)
    } catch (error) {
      console.error('[plaid/webhook] sync failed', error)
    }
  }

  if (type === 'ITEM' && (code === 'ERROR' || code === 'PENDING_EXPIRATION')) {
    console.warn('[plaid/webhook] link issue', { ref, code })
  }

  return { received: true }
})
