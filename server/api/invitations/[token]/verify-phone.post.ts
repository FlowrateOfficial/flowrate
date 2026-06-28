import { z } from 'zod'
import { verifyInvitationPhone } from '../../../lib/services/members.service'

const bodySchema = z.object({
  code: z.string().min(4).max(8)
})

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  const { code } = await readValidatedBody(event, bodySchema.parse)
  return verifyInvitationPhone(token, code)
})
