import { z } from 'zod'
import { requireAdmin } from '../../lib/admin'
import { adminPurgeUserByEmail } from '../../lib/services/user-deletion.service'

const bodySchema = z.object({
  email: z.string().email()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { email } = await readValidatedBody(event, bodySchema.parse)
  return adminPurgeUserByEmail(email, event)
})
