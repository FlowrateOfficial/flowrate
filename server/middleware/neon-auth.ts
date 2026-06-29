// ANCHOR: OAuth session exchange middleware — completes Google/GitHub redirect
import { tryOAuthSessionExchange } from '../utils/neonAuthProxy'

export default defineEventHandler(async (event) => {
  const path = event.path

  if (
    path.startsWith('/_nuxt')
    || path.startsWith('/__nuxt')
    || path.startsWith('/_locales')
    || path.startsWith('/_ipx')
    || path === '/favicon.ico'
    || path === '/sw.js'
  ) {
    return
  }

  const redirectUrl = await tryOAuthSessionExchange(event)
  if (redirectUrl) {
    return sendRedirect(event, redirectUrl, 302)
  }
})
