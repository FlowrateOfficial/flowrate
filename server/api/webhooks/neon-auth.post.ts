import { handleNeonAuthWebhook, verifyNeonAuthWebhook } from '../../lib/neonAuthWebhook'

export default defineEventHandler(async (event) => {
  const rawBody = await readRawBody(event, 'utf8')
  if (!rawBody) {
    throw createError({ statusCode: 400, message: 'Missing webhook body' })
  }

  const payload = await verifyNeonAuthWebhook(event, rawBody)
  const result = await handleNeonAuthWebhook(event, payload)

  if (payload.event_type === 'user.before_create') {
    return result
  }

  return result
})
