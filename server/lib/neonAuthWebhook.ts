import crypto from 'node:crypto'
import type { H3Event } from 'h3'
import { getStripeClient } from './stripe/client'
import { syncStripeCustomerPhone } from './stripe/customer-profile'
import { sendSms } from './twilio'

const JWKS_CACHE_MS = 10 * 60_000
let jwksCache: { fetchedAt: number, keys: Array<JsonWebKey & { kid?: string }> } | null = null

interface NeonWebhookPayload {
  event_id: string
  event_type: string
  timestamp: string
  user?: {
    id?: string
    email?: string
    name?: string
    phone_number?: string
  }
  event_data?: Record<string, unknown>
}

function headerValue(event: H3Event, name: string): string | null {
  const value = getRequestHeader(event, name)
  return value?.trim() || null
}

async function fetchJwks(authUrl: string): Promise<Array<JsonWebKey & { kid?: string }>> {
  const now = Date.now()
  if (jwksCache && now - jwksCache.fetchedAt < JWKS_CACHE_MS) {
    return jwksCache.keys
  }

  const response = await fetch(`${authUrl.replace(/\/$/, '')}/.well-known/jwks.json`)
  if (!response.ok) {
    throw createError({ statusCode: 502, message: 'Failed to fetch Neon Auth JWKS' })
  }

  const data = await response.json() as { keys?: Array<JsonWebKey & { kid?: string }> }
  const keys = data.keys ?? []
  jwksCache = { fetchedAt: now, keys }
  return keys
}

export async function verifyNeonAuthWebhook(
  event: H3Event,
  rawBody: string
): Promise<NeonWebhookPayload> {
  const config = useRuntimeConfig(event)
  const authUrl = config.public.neonAuthUrl as string
  if (!authUrl) {
    throw createError({ statusCode: 503, message: 'Neon Auth is not configured' })
  }

  const signature = headerValue(event, 'x-neon-signature')
  const kid = headerValue(event, 'x-neon-signature-kid')
  const timestamp = headerValue(event, 'x-neon-timestamp')

  if (!signature || !kid || !timestamp) {
    throw createError({ statusCode: 400, message: 'Missing Neon webhook signature headers' })
  }

  const ageMs = Date.now() - Number.parseInt(timestamp, 10)
  if (!Number.isFinite(ageMs) || Math.abs(ageMs) > 5 * 60_000) {
    throw createError({ statusCode: 400, message: 'Neon webhook timestamp is too old' })
  }

  const keys = await fetchJwks(authUrl)
  const jwk = keys.find(key => key.kid === kid)
  if (!jwk) {
    jwksCache = null
    throw createError({ statusCode: 400, message: 'Neon webhook signing key not found' })
  }

  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' })
  const [headerB64, emptyPayload, signatureB64] = signature.split('.')
  if (emptyPayload !== '' || !signatureB64) {
    throw createError({ statusCode: 400, message: 'Invalid Neon webhook signature format' })
  }

  const payloadB64 = Buffer.from(rawBody, 'utf8').toString('base64url')
  const signaturePayload = `${timestamp}.${payloadB64}`
  const signaturePayloadB64 = Buffer.from(signaturePayload, 'utf8').toString('base64url')
  const signingInput = `${headerB64}.${signaturePayloadB64}`

  const isValid = crypto.verify(
    null,
    Buffer.from(signingInput),
    publicKey,
    Buffer.from(signatureB64, 'base64url')
  )

  if (!isValid) {
    throw createError({ statusCode: 400, message: 'Invalid Neon webhook signature' })
  }

  return JSON.parse(rawBody) as NeonWebhookPayload
}

async function sendAuthEmail(
  event: H3Event,
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const config = useRuntimeConfig(event)
  const apiKey = config.resendApiKey as string
  const from = config.authFromEmail as string

  if (!apiKey || !from) {
    throw createError({
      statusCode: 503,
      message: 'Auth email delivery is not configured (set RESEND_API_KEY and AUTH_FROM_EMAIL)'
    })
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, html })
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { message?: string }
    throw createError({
      statusCode: 502,
      message: data.message ?? 'Failed to send auth email'
    })
  }
}

async function handleSendOtp(event: H3Event, payload: NeonWebhookPayload): Promise<void> {
  const otpCode = String(payload.event_data?.otp_code ?? '')
  const delivery = String(payload.event_data?.delivery_preference ?? 'email')
  const email = payload.user?.email
  const phone = payload.user?.phone_number

  if (!otpCode) {
    throw createError({ statusCode: 400, message: 'Missing OTP code in webhook payload' })
  }

  if (delivery === 'sms') {
    if (!phone) {
      throw createError({ statusCode: 400, message: 'Missing phone number for SMS OTP' })
    }
    await sendSms(phone, `Your FlowRate verification code is ${otpCode}`)
    return
  }

  if (!email) {
    throw createError({ statusCode: 400, message: 'Missing email for OTP delivery' })
  }

  const otpType = String(payload.event_data?.otp_type ?? 'sign-in')
  const subject = otpType === 'email-verification'
    ? 'Verify your FlowRate email'
    : otpType === 'forget-password'
      ? 'Your FlowRate password reset code'
      : 'Your FlowRate sign-in code'

  await sendAuthEmail(
    event,
    email,
    subject,
    `<p>Your FlowRate verification code is <strong>${otpCode}</strong>.</p>`
  )
}

async function handleSendMagicLink(event: H3Event, payload: NeonWebhookPayload): Promise<void> {
  const linkUrl = String(payload.event_data?.link_url ?? '')
  const email = payload.user?.email

  if (!linkUrl || !email) {
    throw createError({ statusCode: 400, message: 'Missing magic link payload' })
  }

  await sendAuthEmail(
    event,
    email,
    'Sign in to FlowRate',
    `<p><a href="${linkUrl}">Click here to sign in to FlowRate</a></p><p>This link expires soon.</p>`
  )
}

async function handlePhoneVerified(payload: NeonWebhookPayload): Promise<void> {
  const userId = payload.user?.id
  const phone = String(payload.event_data?.phone_number ?? payload.user?.phone_number ?? '')

  if (!userId || !phone) {
    console.warn('[neon-auth/webhook] phone_number.verified missing user or phone')
    return
  }

  await prisma.user.updateMany({
    where: { id: userId },
    data: {
      phone,
      phoneVerified: new Date()
    }
  })

  const stripeKey = useRuntimeConfig().stripeSecretKey as string | undefined
  if (stripeKey) {
    const stripe = getStripeClient(stripeKey)
    await syncStripeCustomerPhone(stripe, userId, phone).catch((error) => {
      console.warn('[neon-auth/webhook] Stripe phone sync failed:', error)
    })
  }
}

export async function handleNeonAuthWebhook(event: H3Event, payload: NeonWebhookPayload) {
  switch (payload.event_type) {
    case 'send.otp':
      await handleSendOtp(event, payload)
      return { ok: true }
    case 'send.magic_link':
      await handleSendMagicLink(event, payload)
      return { ok: true }
    case 'user.before_create':
      return { allowed: true }
    case 'user.created':
      return { ok: true }
    case 'phone_number.verified':
      await handlePhoneVerified(payload)
      return { ok: true }
    default:
      return { ok: true }
  }
}
