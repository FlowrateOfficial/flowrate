import { z } from 'zod'
import {
  requirePlaid,
  syncPlaidAccountsForLink,
  syncPlaidLinkTransactions,
  throwPlaidError,
  upsertPlaidLink
} from '../../lib/plaid'
import { assertCanConnectBank } from '../../lib/billing/enforcement'

const bodySchema = z.object({
  publicToken: z.string().min(1),
  visibility: z.enum(['PERSONAL', 'SHARED']).default('PERSONAL'),
  institution: z.string().optional(),
  metadata: z.object({
    institution: z.object({ name: z.string().optional() }).passthrough().optional()
  }).passthrough().optional()
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

  const context = {
    userId: user.id,
    spaceId: space.id,
    visibility
  }

  try {
    const exchange = await client.itemPublicTokenExchange({ public_token: body.publicToken })
    const token = exchange.data.access_token
    const ref = exchange.data.item_id

    const existingLink = await prisma.plaidLink.findUnique({ where: { ref } })
    if (!existingLink) {
      await assertCanConnectBank(user.id)
    }

    const institutionName = typeof body.metadata?.institution === 'object'
      && body.metadata?.institution !== null
      && 'name' in body.metadata.institution
      ? String((body.metadata.institution as { name?: string }).name ?? '')
      : body.institution

    const link = await upsertPlaidLink(context, ref, token, institutionName || null)
    const synced = await syncPlaidAccountsForLink(client, link, context)
    await syncPlaidLinkTransactions(client, link.id)

    return { synced, ref }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    console.error('[plaid/exchange]', error)
    throwPlaidError(error, 'Could not link bank account with Plaid')
  }
})
