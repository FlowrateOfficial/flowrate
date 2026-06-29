// NOTE - ANCHOR: Stripe FC account ID extraction from Stripe.js session object
export function extractFcAccountIds(session: unknown): string[] {
  if (!session || typeof session !== 'object') return []

  const accounts = (session as { accounts?: unknown }).accounts
  if (!accounts) return []

  if (Array.isArray(accounts)) {
    return accounts
      .map(a => (a && typeof a === 'object' && 'id' in a ? String((a as { id: string }).id) : ''))
      .filter(Boolean)
  }

  if (typeof accounts === 'object' && accounts !== null && 'data' in accounts) {
    const data = (accounts as { data?: unknown }).data
    if (!Array.isArray(data)) return []
    return data
      .map(a => (a && typeof a === 'object' && 'id' in a ? String((a as { id: string }).id) : ''))
      .filter(Boolean)
  }

  return []
}
