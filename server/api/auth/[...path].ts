import { proxyNeonAuthRequest } from '../../utils/neonAuthProxy'
import { isAllowedAuthProxyPath } from '#shared/security'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  if (!path || !isAllowedAuthProxyPath(path)) {
    throw createError({ statusCode: 404, message: 'Not found' })
  }
  return proxyNeonAuthRequest(event, path)
})
