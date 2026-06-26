import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().min(2).max(100)
})

export default defineEventHandler(async (event) => {
  const user = await requireNeonAuth(event)
  const { name } = await readValidatedBody(event, bodySchema.parse)

  await prisma.user.update({
    where: { id: user.id },
    data: { name }
  })

  return { success: true }
})
