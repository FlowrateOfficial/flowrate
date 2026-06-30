// ANCHOR: Manual sync result merge — Stripe + Plaid partial failures
export interface ProviderSyncResult {
  imported: number
  accounts: number
}

export function mergeSyncResults(
  stripe: ProviderSyncResult,
  plaid: ProviderSyncResult
): ProviderSyncResult {
  return {
    imported: stripe.imported + plaid.imported,
    accounts: stripe.accounts + plaid.accounts
  }
}

export const EMPTY_SYNC_RESULT: ProviderSyncResult = { imported: 0, accounts: 0 }
