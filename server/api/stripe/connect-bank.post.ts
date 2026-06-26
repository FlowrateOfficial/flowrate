import { z } from 'zod'
import {
  createBankLinkSession,
  ensureStripeCustomer,
  requireStripe
} from '../../lib/stripe'

const bodySchema = z.object({
  visibility: z.enum(['PERSONAL', 'SHARED']).default('PERSONAL')
})

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)

  if (!canConnectBanks(membership.role)) {
    throw createError({ statusCode: 403, message: 'You cannot connect bank accounts in this space' })
  }

  const body = await readBody(event).then(b => bodySchema.parse(b ?? {}))
  const { config, stripe } = requireStripe(event)

  const context = {
    userId: user.id,
    spaceId: space.id,
    visibility: body.visibility
  }

  const customerId = await ensureStripeCustomer(stripe, user, context)
  const session = await createBankLinkSession(
    stripe,
    event,
    String(config.public.appUrl ?? ''),
    customerId,
    context
  )

  return { clientSecret: session.client_secret, visibility: body.visibility }
})
