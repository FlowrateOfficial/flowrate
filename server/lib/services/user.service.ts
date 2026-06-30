// ANCHOR: User profile + phone verification service
import type { AppPlan } from '#shared/billing'
import type { H3Event } from 'h3'
import type { z } from 'zod'
import type { profilePatchBodySchema } from '../schemas/api'
import { isAdminEmail } from '../admin'
import { getUserBillingSnapshot } from '../billing'
import { isTwilioVerifyConfigured, sendPhoneVerification, checkPhoneVerification } from '../twilio'
import { syncUserProfileToIntegrations, syncVerifiedPhoneToStripe } from '../user-profile-sync'
import { normalizePhone } from '../../utils/phone'
import {
  findUserByPhone,
  findUserPhoneState,
  findUserProfile,
  markPhoneVerified,
  profilePlan,
  updateUserProfile
} from '../repositories/user.repository'

type ProfilePatchBody = z.infer<typeof profilePatchBodySchema>

export async function getUserProfileResponse(userId: string, adminEmails: string | string[] | undefined) {
  const profile = await findUserProfile(userId)
  if (!profile) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  const billing = await getUserBillingSnapshot(userId)
  const adminRaw = Array.isArray(adminEmails) ? adminEmails.join(',') : adminEmails

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    phoneVerified: profile.phoneVerified != null,
    plan: profilePlan(profile),
    isAdmin: isAdminEmail(profile.email, adminRaw),
    billing: billing
      ? {
          customerId: billing.customerId,
          subscription: billing.subscription
            ? {
                status: billing.subscription.status,
                periodEnd: billing.subscription.periodEnd?.toISOString() ?? null,
                cancelAtEnd: billing.subscription.cancelAtEnd,
                planKey: billing.subscription.planKey,
                priceId: billing.subscription.priceId
              }
            : null
        }
      : null
  }
}

export async function updateUserProfileResponse(
  event: H3Event,
  userId: string,
  body: ProfilePatchBody,
  adminEmails: string | string[] | undefined
) {
  const data: { name?: string, phone?: string | null, phoneVerified?: null } = {}

  if (body.name !== undefined) {
    data.name = body.name
  }

  if (body.phone !== undefined) {
    if (body.phone === null || body.phone.trim() === '') {
      data.phone = null
      data.phoneVerified = null
    } else {
      const normalized = normalizePhone(body.phone)
      if (!normalized) {
        throw createError({
          statusCode: 400,
          message: 'Phone must be a valid number in E.164 format (e.g. +14155552671)'
        })
      }

      const taken = await findUserByPhone(normalized, userId)
      if (taken) {
        throw createError({ statusCode: 409, message: 'This phone number is already in use' })
      }

      const current = await findUserPhoneState(userId)
      data.phone = normalized
      if (current?.phone !== normalized) {
        data.phoneVerified = null
      }
    }
  }

  if (!Object.keys(data).length) {
    throw createError({ statusCode: 400, message: 'No profile fields to update' })
  }

  const updated = await updateUserProfile(userId, data)
  if (!updated) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  if (body.name !== undefined) {
    await syncUserProfileToIntegrations(event, {
      userId: updated.id,
      name: updated.name,
      email: updated.email
    })
  }

  if (body.phone !== undefined) {
    const phoneToSync = updated.phoneVerified ? updated.phone : null
    await syncVerifiedPhoneToStripe(event, updated.id, phoneToSync)
  }

  let verificationSent = false
  let verificationError: string | null = null

  const shouldSendVerification = body.phone !== undefined && updated.phone && !updated.phoneVerified
  if (shouldSendVerification && isTwilioVerifyConfigured()) {
    try {
      await sendPhoneVerification(updated.phone!)
      verificationSent = true
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'statusMessage' in err
        ? String((err as { statusMessage?: string }).statusMessage)
        : 'Failed to send verification code'
      verificationError = message
    }
  }

  const adminRaw = Array.isArray(adminEmails) ? adminEmails.join(',') : adminEmails

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    phoneVerified: updated.phoneVerified != null,
    plan: updated.plan as AppPlan,
    isAdmin: isAdminEmail(updated.email, adminRaw),
    verificationSent,
    verificationError
  }
}

export async function verifyUserPhone(event: H3Event, userId: string, code: string) {
  const profile = await findUserPhoneState(userId)

  if (!profile?.phone) {
    throw createError({ statusCode: 400, message: 'No phone number on file' })
  }

  if (profile.phoneVerified) {
    return { phoneVerified: true }
  }

  const approved = await checkPhoneVerification(profile.phone, code)
  if (!approved) {
    throw createError({ statusCode: 400, message: 'Invalid or expired verification code' })
  }

  await markPhoneVerified(userId)
  await syncVerifiedPhoneToStripe(event, userId, profile.phone)

  return { phoneVerified: true }
}

export async function resendUserPhoneVerification(userId: string) {
  const profile = await findUserPhoneState(userId)

  if (!profile?.phone) {
    throw createError({ statusCode: 400, message: 'No phone number on file' })
  }

  if (profile.phoneVerified) {
    return { sent: false, phoneVerified: true }
  }

  await sendPhoneVerification(profile.phone)

  return { sent: true, phoneVerified: false }
}
