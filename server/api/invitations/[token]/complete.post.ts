import { z } from 'zod'
import { completePhoneInvitation } from '../../../lib/services/members.service'

const bodySchema = z.object({
  password: z.string().min(8).max(128),
  email: z.string().email().optional(),
  name: z.string().min(1).max(100).optional()
})

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  const body = await readValidatedBody(event, bodySchema.parse)
  return completePhoneInvitation(token, body, event)
})
