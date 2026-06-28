import { z } from 'zod'
import {
  createBankLinkSession,
  ensureStripeCustomer,
  FINANCIAL_CONNECTIONS_BANK_COUNTRIES,
  FINANCIAL_CONNECTIONS_DOCS_URL,
  requireStripe,
  throwStripeApiError
} from '../../lib/stripe'

const bodySchema = z.object({
  visibility: z.enum(['PERSONAL', 'SHARED']).default('PERSONAL')
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

  try {
    const { config, stripe } = requireStripe(event)

    const context = {
      userId: user.id,
      spaceId: space.id,
      visibility
    }

    const customerId = await ensureStripeCustomer(stripe, user, {
      userId: user.id,
      spaceId: space.id,
      visibility
    })
    const session = await createBankLinkSession(
      stripe,
      event,
      String(config.public.appUrl ?? ''),
      customerId,
      context
    )

    return {
      clientSecret: session.client_secret,
      visibility,
      bankCountries: [...FINANCIAL_CONNECTIONS_BANK_COUNTRIES],
      docsUrl: FINANCIAL_CONNECTIONS_DOCS_URL
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throwStripeApiError(error)
  }
})
