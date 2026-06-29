import { z } from 'zod'
import { requireAuthUser } from '../../../lib/auth'
import { checkPhoneVerification } from '../../../lib/twilio'
import { syncVerifiedPhoneToStripe } from '../../../lib/user-profile-sync'

const bodySchema = z.object({
  code: z.string().min(4).max(8)
})

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const { code } = await readValidatedBody(event, bodySchema.parse)

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phone: true, phoneVerified: true }
  })

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

  await prisma.user.update({
    where: { id: user.id },
    data: { phoneVerified: new Date() }
  })

  await syncVerifiedPhoneToStripe(event, user.id, profile.phone)

  return { phoneVerified: true }
})
