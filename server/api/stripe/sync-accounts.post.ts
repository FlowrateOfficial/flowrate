import { z } from 'zod'
import {
  assertFinancialConnectionOwnership,
  requireStripe,
  upsertFinancialConnectionAccount
} from '../../lib/stripe'

const bodySchema = z.object({
  accountIds: z.array(z.string().min(1)).min(1),
  visibility: z.enum(['PERSONAL', 'SHARED']).default('PERSONAL')
})

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)

  if (!canConnectBanks(membership.role)) {
    throw createError({ statusCode: 403, message: 'You cannot connect bank accounts in this space' })
  }

  const body = await readBody(event).then(b => bodySchema.parse(b ?? {}))
  const { stripe } = requireStripe(event)

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { stripeCustomerId: true }
  })

  if (!dbUser?.stripeCustomerId) {
    throw createError({ statusCode: 400, message: 'Stripe customer not found' })
  }

  const context = {
    userId: user.id,
    spaceId: space.id,
    visibility: body.visibility
  }

  const synced = []

  for (const accountId of body.accountIds) {
    const fcAccount = await stripe.financialConnections.accounts.retrieve(accountId)
    assertFinancialConnectionOwnership(fcAccount, dbUser.stripeCustomerId)
    const record = await upsertFinancialConnectionAccount(fcAccount, context)
    synced.push({
      id: record.id,
      name: record.name,
      balance: Number(record.balance)
    })
  }

  return { synced }
})
