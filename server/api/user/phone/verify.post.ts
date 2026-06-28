import { z } from 'zod'
import { requireAuthUser } from '../../../lib/auth'
import { checkPhoneVerification } from '../../../lib/twilio'

const bodySchema = z.object({
  code: z.string().min(4).max(8)
})

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const { code } = await readValidatedBody(event, bodySchema.parse)

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phone: true, phoneVerifiedAt: true }
  })

  if (!profile?.phone) {
    throw createError({ statusCode: 400, message: 'No phone number on file' })
  }

  if (profile.phoneVerifiedAt) {
    return { phoneVerified: true }
  }

  const approved = await checkPhoneVerification(profile.phone, code)
  if (!approved) {
    throw createError({ statusCode: 400, message: 'Invalid or expired verification code' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { phoneVerifiedAt: new Date() }
  })

  return { phoneVerified: true }
})
