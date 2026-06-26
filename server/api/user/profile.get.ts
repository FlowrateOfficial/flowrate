import { requireAuthUser } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, plan: true }
  })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return profile
})
