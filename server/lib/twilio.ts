// ANCHOR: Twilio SMS and Verify
import { normalizePhone } from '../utils/phone'

export interface TwilioConfig {
  accountSid: string
  authToken: string
  fromNumber: string
}

export interface TwilioVerifyConfig {
  accountSid: string
  authToken: string
  verifyServiceSid: string
}

export function getTwilioConfig(): TwilioConfig | null {
  const config = useRuntimeConfig()
  const accountSid = config.twilioAccountSid
  const authToken = config.twilioAuthToken
  const fromNumber = config.twilioPhoneNumber

  if (!accountSid || !authToken || !fromNumber) return null
  return { accountSid, authToken, fromNumber }
}

export function getTwilioVerifyConfig(): TwilioVerifyConfig | null {
  const config = useRuntimeConfig()
  const accountSid = config.twilioAccountSid
  const authToken = config.twilioAuthToken
  const verifyServiceSid = config.twilioVerifyServiceSid

  if (!accountSid || !authToken || !verifyServiceSid) return null
  return { accountSid, authToken, verifyServiceSid }
}

export function isTwilioConfigured(): boolean {
  return getTwilioConfig() !== null
}

export function isTwilioVerifyConfigured(): boolean {
  return getTwilioVerifyConfig() !== null
}

function twilioCredentials(config: { accountSid: string, authToken: string }): string {
  return Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')
}

async function twilioVerifyRequest(
  path: string,
  body: Record<string, string>
): Promise<{ status?: string, message?: string }> {
  const twilio = getTwilioVerifyConfig()
  if (!twilio) {
    throw createError({ statusCode: 503, message: 'Phone verification is not configured' })
  }

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${twilio.verifyServiceSid}/${path}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioCredentials(twilio)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(body)
    }
  )

  const data = await response.json() as { status?: string, message?: string }
  if (!response.ok) {
    throw createError({
      statusCode: 502,
      message: data.message ?? 'Twilio Verify request failed'
    })
  }

  return data
}

export async function sendPhoneVerification(to: string): Promise<void> {
  const normalized = normalizePhone(to)
  if (!normalized) {
    throw createError({ statusCode: 400, message: 'Invalid phone number' })
  }

  const data = await twilioVerifyRequest('Verifications', {
    To: normalized,
    Channel: 'sms'
  })

  if (data.status !== 'pending') {
    throw createError({ statusCode: 502, message: 'Failed to send verification code' })
  }
}

export async function checkPhoneVerification(to: string, code: string): Promise<boolean> {
  const normalized = normalizePhone(to)
  if (!normalized) {
    throw createError({ statusCode: 400, message: 'Invalid phone number' })
  }

  const trimmed = code.trim()
  if (!/^\d{4,8}$/.test(trimmed)) {
    throw createError({ statusCode: 400, message: 'Invalid verification code' })
  }

  const data = await twilioVerifyRequest('VerificationCheck', {
    To: normalized,
    Code: trimmed
  })

  return data.status === 'approved'
}

export async function sendSms(to: string, body: string): Promise<{ sid: string }> {
  const twilio = getTwilioConfig()
  if (!twilio) {
    throw createError({ statusCode: 503, message: 'Twilio is not configured' })
  }

  const normalized = normalizePhone(to)
  if (!normalized) {
    throw createError({ statusCode: 400, message: 'Invalid phone number' })
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${twilioCredentials(twilio)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: normalized,
        From: twilio.fromNumber,
        Body: body
      })
    }
  )

  const data = await response.json() as { sid?: string, message?: string }
  if (!response.ok) {
    throw createError({
      statusCode: 502,
      message: data.message ?? 'Failed to send SMS via Twilio'
    })
  }

  return { sid: data.sid! }
}
