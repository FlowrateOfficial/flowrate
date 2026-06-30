import { requireAuthUser } from '../../../lib/auth'
import { resendUserPhoneVerification } from '../../../lib/services/user.service'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  return resendUserPhoneVerification(user.id)
})
