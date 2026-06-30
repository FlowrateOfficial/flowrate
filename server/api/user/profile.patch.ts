import { profilePatchBodySchema } from '../../lib/schemas/api'
import { requireSessionUser } from '../../lib/auth'
import { updateUserProfileResponse } from '../../lib/services/user.service'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const config = useRuntimeConfig(event)
  const body = await readValidatedBody(event, profilePatchBodySchema.parse)
  return updateUserProfileResponse(event, user.id, body, config.adminEmails)
})
