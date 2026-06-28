import { z } from 'zod'
import {
  assertFinancialConnectionOwnership,
  ensureStripeCustomer,
  refreshFinancialConnectionAccount,
  requireStripe,
  upsertFinancialConnectionAccount
} from '../../lib/stripe'
import { syncSpaceTransactions } from '../../lib/transactionSync'

const bodySchema = z.object({
  accountIds: z.array(z.string().min(1)).optional(),
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
  const { stripe } = requireStripe(event)

  const context = {
    userId: user.id,
    spaceId: space.id,
    visibility
  }

  const stripeCustomerId = await ensureStripeCustomer(stripe, user, {
    userId: user.id,
    spaceId: space.id,
    visibility
  })

  let accountIds = body.accountIds ?? []

  if (accountIds.length === 0 || body.syncAll) {
    const listed = await stripe.financialConnections.accounts.list({
      account_holder: { customer: stripeCustomerId },
      limit: 100
    })
    accountIds = listed.data.map(a => a.id)
  }

  if (!accountIds.length) {
    return { synced: [], message: 'No linked bank accounts found on your Stripe customer yet' }
  }

  const synced = []

  for (const accountId of accountIds) {
    const fcAccount = await refreshFinancialConnectionAccount(stripe, accountId)
    assertFinancialConnectionOwnership(fcAccount, stripeCustomerId)
    const record = await upsertFinancialConnectionAccount(stripe, fcAccount, context)
    if (!record) continue
    synced.push({
      id: record.id,
      name: record.name,
      balance: Number(record.balance),
      currency: record.currency
    })
  }

  await syncSpaceTransactions(stripe, space.id, user.id)

  return { synced }
})
