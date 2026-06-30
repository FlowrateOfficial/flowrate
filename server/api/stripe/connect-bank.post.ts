import {
  createBankLinkSession,
  ensureStripeCustomer,
  requireStripe,
  throwStripeApiError
} from '../../lib/stripe'
import { assertCanConnectBank } from '../../lib/billing/enforcement'
import {
  FINANCIAL_CONNECTIONS_BANK_COUNTRIES,
  FINANCIAL_CONNECTIONS_DOCS_URL
} from '#shared/stripe-financial-connections'
import { connectBankBodySchema } from '../../lib/schemas/api'

export default defineEventHandler(async (event) => {
  const { user, space, membership } = await requireSpaceAccess(event)

  if (!canConnectBanks(membership.role)) {
    throw createError({ statusCode: 403, message: 'You cannot connect bank accounts in this space' })
  }

  if (!canEditFinancials(membership.role, space.type)) {
    throw createError({ statusCode: 403, message: 'You have read-only access to this business space' })
  }

  const body = await readValidatedBody(event, connectBankBodySchema.parse)
  const visibility = membership.role === 'TEEN' ? 'PERSONAL' : body.visibility

  try {
    const { config, stripe } = requireStripe(event)

    await assertCanConnectBank(user.id)

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
    console.error('[stripe/connect-bank]', error)
    throwStripeApiError(error)
  }
})
