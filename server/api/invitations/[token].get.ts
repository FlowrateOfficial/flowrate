import { getInvitationPreview } from '../../lib/services/invitations.service'

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token as string
  return getInvitationPreview(token)
})
