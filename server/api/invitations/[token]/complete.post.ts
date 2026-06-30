import { invitationCompleteBodySchema } from '../../../lib/schemas/api'
import { completePhoneInvitation } from '../../../lib/services/members.service'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  const body = await readValidatedBody(event, invitationCompleteBodySchema.parse)
  return completePhoneInvitation(token, body, event)
})
