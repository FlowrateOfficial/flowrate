// NOTE - ANCHOR: Browser Neon Auth client — same-origin /api/auth proxy
import { createAuthClient, type VanillaBetterAuthClient } from '@neondatabase/auth'
import { BetterAuthVanillaAdapter } from '@neondatabase/auth/vanilla/adapters'

let client: VanillaBetterAuthClient | null = null

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

// NOTE - Clear cached client after sign-out
export function resetAuthClient() {
  client = null
}
