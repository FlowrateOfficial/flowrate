// ANCHOR: Account deletion verification — Neon Auth email OTP + Twilio SMS
import type { H3Event } from 'h3'
import { createError } from 'h3'
import {
  ACCOUNT_DELETE_EMAIL_OTP_TYPE,
  type AccountDeleteChallenge,
  maskPhoneHint,
  resolveAccountDeleteAuthRequirements
} from '#shared/account-delete'
import { findUserPhoneState } from '../repositories/user.repository'
import {
  checkNeonAuthEmailOtp,
  listNeonAuthAccountProviders,
  sendNeonAuthEmailOtp
} from '../../utils/neonAuthProxy'
import { clearDeleteAccountOtp, markDeleteAccountOtp } from '../account-delete-otp-context'
import { checkPhoneVerification, isTwilioVerifyConfigured, sendPhoneVerification } from '../twilio'

export type { AccountDeleteChallenge }

async function loadVerifiedPhoneState(userId: string) {
  const phoneState = await findUserPhoneState(userId)
  const hasVerifiedPhone = Boolean(phoneState?.phone && phoneState.phoneVerified)
  return {
    hasVerifiedPhone,
    phone: hasVerifiedPhone ? phoneState!.phone! : null
  }
}

export async function getAccountDeleteChallenge(
  event: H3Event,
  userId: string,
  email: string
): Promise<AccountDeleteChallenge> {
  const providerIds = await listNeonAuthAccountProviders(event)
  const { oauthProviders, requiresPassword } = resolveAccountDeleteAuthRequirements(providerIds)
  const { hasVerifiedPhone, phone } = await loadVerifiedPhoneState(userId)

  return {
    email,
    requiresPassword,
    oauthProviders,
    hasVerifiedPhone,
    phoneHint: phone ? maskPhoneHint(phone) : null
  }
}

export async function sendAccountDeleteVerification(
  event: H3Event,
  userId: string,
  email: string
): Promise<{ emailSent: boolean, phoneSent: boolean }> {
  markDeleteAccountOtp(email)
  await sendNeonAuthEmailOtp(event, email, ACCOUNT_DELETE_EMAIL_OTP_TYPE)

  const { hasVerifiedPhone, phone } = await loadVerifiedPhoneState(userId)
  if (!hasVerifiedPhone || !phone || !isTwilioVerifyConfigured()) {
    return { emailSent: true, phoneSent: false }
  }

  try {
    await sendPhoneVerification(phone)
    return { emailSent: true, phoneSent: true }
  } catch (error) {
    console.warn('[account-delete] phone verification send failed:', error)
    return { emailSent: true, phoneSent: false }
  }
}

async function verifyPhoneDeleteCode(userId: string, phoneCode: string): Promise<void> {
  if (!isTwilioVerifyConfigured()) {
    throw createError({ statusCode: 503, message: 'Phone verification is not configured' })
  }

  const phoneState = await findUserPhoneState(userId)
  if (!phoneState?.phone) {
    throw createError({ statusCode: 400, message: 'No verified phone number on file' })
  }

  const approved = await checkPhoneVerification(phoneState.phone, phoneCode.trim())
  if (!approved) {
    throw createError({ statusCode: 400, message: 'Invalid or expired phone verification code' })
  }
}

export async function verifyAccountDeleteCredentials(
  event: H3Event,
  input: {
    userId: string
    email: string
    emailCode: string
    phoneCode?: string
    password?: string
    requiresPassword: boolean
    hasVerifiedPhone: boolean
  }
): Promise<void> {
  const email = input.email.trim().toLowerCase()
  await checkNeonAuthEmailOtp(event, email, input.emailCode.trim(), ACCOUNT_DELETE_EMAIL_OTP_TYPE)
  clearDeleteAccountOtp(email)

  if (input.hasVerifiedPhone) {
    if (!input.phoneCode?.trim()) {
      throw createError({ statusCode: 400, message: 'Phone verification code is required' })
    }
    await verifyPhoneDeleteCode(input.userId, input.phoneCode)
  }

  if (input.requiresPassword && !input.password?.trim()) {
    throw createError({ statusCode: 400, message: 'Password is required' })
  }
}
