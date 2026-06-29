import { z } from 'zod'
import { isAdminEmail } from '../../lib/admin'
import { requireSessionUser } from '../../lib/auth'
import { isTwilioVerifyConfigured, sendPhoneVerification } from '../../lib/twilio'
import { syncUserProfileToIntegrations, syncVerifiedPhoneToStripe } from '../../lib/user-profile-sync'
import { normalizePhone } from '../../utils/phone'

const bodySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable()
})

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const config = useRuntimeConfig(event)
  const body = await readValidatedBody(event, bodySchema.parse)

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

      const taken = await prisma.user.findFirst({
        where: { phone: normalized, NOT: { id: user.id } }
      })
      if (taken) {
        throw createError({ statusCode: 409, message: 'This phone number is already in use' })
      }

      const current = await prisma.user.findUnique({
        where: { id: user.id },
        select: { phone: true }
      })

      data.phone = normalized
      if (current?.phone !== normalized) {
        data.phoneVerified = null
      }
    }
  }

  if (!Object.keys(data).length) {
    throw createError({ statusCode: 400, message: 'No profile fields to update' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data
  })

  const updated = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      phoneVerified: true,
      plan: true
    }
  })

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

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    phone: updated.phone,
    phoneVerified: updated.phoneVerified != null,
    plan: updated.plan,
    isAdmin: isAdminEmail(updated.email, config.adminEmails),
    verificationSent,
    verificationError
  }
})
