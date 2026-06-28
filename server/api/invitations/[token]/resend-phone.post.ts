import { resendInvitationPhoneCode } from '../../../lib/services/members.service'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  return resendInvitationPhoneCode(token)
})
