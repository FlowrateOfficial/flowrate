import { requireSessionUser } from '../../lib/auth'
import { getUserProfileResponse } from '../../lib/services/user.service'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const config = useRuntimeConfig(event)
  return getUserProfileResponse(user.id, config.adminEmails)
})
