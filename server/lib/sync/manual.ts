import type { H3Event } from 'h3'
import { processAllowancePayouts } from '../allowance'
import {
  assertCanManualSync,
  recordManualSync
} from '../billing/enforcement'
import { requirePlaid, syncPlaidSpaceTransactions } from '../plaid'
import { requireStripe } from '../stripe'
import { syncSpaceTransactions } from '../transactionSync'
import { EMPTY_SYNC_RESULT, mergeSyncResults } from './results'

export async function runManualSpaceSync(event: H3Event) {
  const { user, space } = await requireSpaceAccess(event)

  await assertCanManualSync(user.id)
  await recordManualSync(user.id)

  let stripeResult = { ...EMPTY_SYNC_RESULT }
  try {
    const { stripe } = requireStripe(event)
    stripeResult = await syncSpaceTransactions(stripe, space.id, user.id)
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode !== 503) {
      throw error
    }
  }

  let plaidResult = { ...EMPTY_SYNC_RESULT }
  try {
    const { client } = requirePlaid(event)
    plaidResult = await syncPlaidSpaceTransactions(client, space.id, user.id)
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode !== 503) {
      throw error
    }
  }

  await processAllowancePayouts(space.id)

  return mergeSyncResults(stripeResult, plaidResult)
}
