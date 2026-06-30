import { phoneVerifyBodySchema } from '../../../lib/schemas/api'
import { verifyInvitationPhone } from '../../../lib/services/members.service'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  const { code } = await readValidatedBody(event, phoneVerifyBodySchema.parse)
  return verifyInvitationPhone(token, code)
})
