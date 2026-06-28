// ANCHOR: Stripe SDK errors → stable H3 error codes
import type Stripe from 'stripe'

type StripeErrorCode =
  | 'STRIPE_KEY_MISMATCH'
  | 'STRIPE_LIVEMODE_MISMATCH'
  | 'STRIPE_FC_NOT_ENABLED'
  | 'STRIPE_FC_PERMISSION_DENIED'
  | 'STRIPE_CONNECT_FAILED'

function isStripeError(error: unknown): error is Stripe.errors.StripeError {
  return Boolean(
    error
    && typeof error === 'object'
    && 'type' in error
    && typeof (error as Stripe.errors.StripeError).type === 'string'
    && (error as Stripe.errors.StripeError).type.startsWith('Stripe')
  )
}

function mapStripeError(error: Stripe.errors.StripeError): {
  statusCode: number
  code: StripeErrorCode
  message: string
} {
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase()

  if (error.code === 'livemode_mismatch' || text.includes('livemode')) {
    return {
      statusCode: 400,
      code: 'STRIPE_LIVEMODE_MISMATCH',
      message: 'Stripe test and live keys do not match. Use matching publishable/secret keys in Vercel.'
    }
  }

  if (
    text.includes('financial connections')
    && (text.includes('not enabled') || text.includes('not activated') || text.includes('not approved'))
  ) {
    return {
      statusCode: 400,
      code: 'STRIPE_FC_NOT_ENABLED',
      message: 'Financial Connections is not approved for live mode in your Stripe account.'
    }
  }

  if (text.includes('permission') && text.includes('financial connections')) {
    return {
      statusCode: 400,
      code: 'STRIPE_FC_PERMISSION_DENIED',
      message: 'Your Stripe Financial Connections application does not include the requested data permissions.'
    }
  }

  if (error.code === 'url_invalid' || text.includes('return_url')) {
    return {
      statusCode: 400,
      code: 'STRIPE_CONNECT_FAILED',
      message: 'Stripe rejected the bank connection request. Check APP_URL and Stripe Financial Connections settings.'
    }
  }

  return {
    statusCode: error.statusCode ?? 502,
    code: 'STRIPE_CONNECT_FAILED',
    message: error.message || 'Bank connection failed'
  }
}

export function throwStripeApiError(error: unknown, fallback = 'Bank connection failed'): never {
  if (isStripeError(error)) {
    const mapped = mapStripeError(error)
    throw createError({
      statusCode: mapped.statusCode,
      message: mapped.message,
      data: { code: mapped.code }
    })
  }

  if (error instanceof Error && error.message) {
    throw createError({
      statusCode: 502,
      message: error.message,
      data: { code: 'STRIPE_CONNECT_FAILED' as const }
    })
  }

  throw createError({
    statusCode: 502,
    message: fallback,
    data: { code: 'STRIPE_CONNECT_FAILED' as const }
  })
}

export function isLivemodeMismatch(error: unknown): boolean {
  if (!isStripeError(error)) return false
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase()
  return error.code === 'livemode_mismatch' || text.includes('livemode')
}
