import type { H3Event } from 'h3'
import { toSpaceContext, type SpaceContext } from '../domain/context'

/** Resolve authenticated space context from an API request. */
export async function requireSpaceContext(event: H3Event): Promise<SpaceContext> {
  const { user, space, membership } = await requireSpaceAccess(event)
  return toSpaceContext(
    { id: user.id, email: user.email, name: user.name ?? null },
    space,
    membership
  )
}

export function parseAccountFilter(raw: string | undefined): 'all' | 'shared' | 'personal' | 'mine' {
  if (raw === 'shared' || raw === 'personal' || raw === 'mine') return raw
  return 'all'
}
