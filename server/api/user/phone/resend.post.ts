import { requireAuthUser } from '../../../lib/auth'
import { sendPhoneVerification } from '../../../lib/twilio'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { phone: true, phoneVerified: true }
  })

  if (!profile?.phone) {
    throw createError({ statusCode: 400, message: 'No phone number on file' })
  }

  if (profile.phoneVerified) {
    return { sent: false, phoneVerified: true }
  }

  await sendPhoneVerification(profile.phone)

  return { sent: true, phoneVerified: false }
})
