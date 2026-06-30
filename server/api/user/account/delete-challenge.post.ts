import { requireAuthUser } from '../../../lib/auth'
import { sendAccountDeleteVerification } from '../../../lib/services/account-delete-challenge.service'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  return sendAccountDeleteVerification(event, user.id, user.email)
})
