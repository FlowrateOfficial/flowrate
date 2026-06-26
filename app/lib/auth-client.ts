import { createAuthClient, type VanillaBetterAuthClient } from '@neondatabase/auth'
import { BetterAuthVanillaAdapter } from '@neondatabase/auth/vanilla/adapters'

let client: VanillaBetterAuthClient | null = null

/**
 * Browser-only Neon Auth client.
 * Points at the same-origin proxy (/api/auth) so session cookies are first-party.
 *
 * @see https://neon.com/docs/auth/authentication-flow
 */
export function getAuthClient(): VanillaBetterAuthClient | null {
  if (!import.meta.client) return null

  const baseUrl = `${window.location.origin}/api/auth`
  if (!client) {
    client = createAuthClient(baseUrl, {
      adapter: BetterAuthVanillaAdapter()
    }) as VanillaBetterAuthClient
  }
  return client
}

/** Clear cached client after sign-out so getSession() does not return stale data. */
export function resetAuthClient() {
  client = null
}
