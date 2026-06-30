// ANCHOR: Plaid webhook processing — deferred sync for fast ACK
import { syncPlaidLinkTransactions } from '../plaid'
import { allowsWebhookSync, userPlanForId } from '../billing/enforcement'
import { deferTask } from '../jobs/defer'
import { findPlaidLinkByRefOnly } from '../repositories/space.repository'

export interface PlaidWebhookPayload {
  webhook_type?: string
  webhook_code?: string
  item_id?: string
}

export async function processPlaidWebhook(
  client: Parameters<typeof syncPlaidLinkTransactions>[0],
  payload: PlaidWebhookPayload
) {
  const { webhook_type: type, webhook_code: code, item_id: ref } = payload

  if (!ref) {
    return { received: true }
  }

  const link = await findPlaidLinkByRefOnly(ref)
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
    deferTask('plaid-sync', async () => {
      await syncPlaidLinkTransactions(client, link.id)
    })
  }

  if (type === 'ITEM' && (code === 'ERROR' || code === 'PENDING_EXPIRATION')) {
    console.warn('[plaid/webhook] link issue', { ref, code })
  }

  return { received: true }
}
