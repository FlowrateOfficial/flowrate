import { getUserPreferences, patchUserPreferences } from '../../lib/services/user-preferences.service'
import { userPreferencesPatchSchema } from '../../lib/schemas/api'
import { requireAuthUser } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  if (event.method === 'GET') return getUserPreferences(user.id)
  const body = await readValidatedBody(event, userPreferencesPatchSchema.parse)
  return patchUserPreferences(user.id, body)
})
