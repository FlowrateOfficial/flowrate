import { requireAuthUser } from '../../../lib/auth'
import { getAccountDeleteChallenge } from '../../../lib/services/account-delete-challenge.service'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  return getAccountDeleteChallenge(event, user.id, user.email)
})
