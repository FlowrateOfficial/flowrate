import { z } from 'zod'
import {
  requirePlaid,
  syncAllPlaidAccountsForUser,
  syncPlaidSpaceTransactions
} from '../../lib/plaid'

const bodySchema = z.object({
  visibility: z.enum(['PERSONAL', 'SHARED']).default('PERSONAL'),
  syncAll: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)

  if (!canConnectBanks(membership.role)) {
    throw createError({ statusCode: 403, message: 'You cannot connect bank accounts in this space' })
  }

  if (!canEditFinancials(membership.role, space.type)) {
    throw createError({ statusCode: 403, message: 'You have read-only access to this business space' })
  }

  const body = await readBody(event).then(b => bodySchema.parse(b ?? {}))
  const visibility = membership.role === 'TEEN' ? 'PERSONAL' : body.visibility
  const { client } = requirePlaid(event)

  const synced = await syncAllPlaidAccountsForUser(client, user.id, space.id, visibility)
  await syncPlaidSpaceTransactions(client, space.id, user.id)

  return { synced }
})
