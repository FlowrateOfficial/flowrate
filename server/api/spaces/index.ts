import { createUserSpace, listUserSpaces } from '../../lib/services/spaces.service'
import { createSpaceBodySchema } from '../../lib/schemas/api'
import { respondWithPrivateCache } from '../../lib/http/cache'

export default defineEventHandler(async (event) => {
  const user = await requireNeonAuth(event)

  if (event.method === 'GET') {
    const payload = await listUserSpaces(user.id)
    return respondWithPrivateCache(event, payload) ?? undefined
  }

  if (event.method === 'POST') {
    const body = await readValidatedBody(event, createSpaceBodySchema.parse)
    return createUserSpace(event, user, body)
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
