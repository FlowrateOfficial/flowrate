import { z } from 'zod'
import { acceptEmailInvitation } from '../../../lib/services/members.service'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')!
  const user = await requireNeonAuth(event)

  return acceptEmailInvitation(token, user.id, user.email)
})
