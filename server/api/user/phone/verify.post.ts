import { phoneVerifyBodySchema } from '../../../lib/schemas/api'
import { requireAuthUser } from '../../../lib/auth'
import { verifyUserPhone } from '../../../lib/services/user.service'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const { code } = await readValidatedBody(event, phoneVerifyBodySchema.parse)
  return verifyUserPhone(event, user.id, code)
})
