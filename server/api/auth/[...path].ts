import { proxyNeonAuthRequest } from '../../utils/neonAuthProxy'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  if (!path) {
    throw createError({ statusCode: 404, message: 'Not found' })
  }
  return proxyNeonAuthRequest(event, path)
})
