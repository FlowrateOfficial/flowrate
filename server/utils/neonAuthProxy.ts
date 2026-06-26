/**
 * Same-origin Neon Auth proxy for Nuxt/Nitro.
 *
 * Neon Auth OAuth sets a session challenge on the auth origin. Without a local
 * proxy, third-party cookies on the neonauth domain are blocked and OAuth appears
 * to succeed (user created) but the app never sees a session.
 */
import { NEON_AUTH_SESSION_VERIFIER_PARAM } from '../../shared/auth'
import { parseCookies, parseSetCookieHeader } from 'better-auth/cookies'
import { SignJWT, jwtVerify } from 'jose'
import type { H3Event } from 'h3'

const NEON_AUTH_COOKIE_PREFIX = '__Secure-neon-auth'
const NEON_AUTH_SESSION_DATA_COOKIE_NAME = `${NEON_AUTH_COOKIE_PREFIX}.local.session_data`
const NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME = `${NEON_AUTH_COOKIE_PREFIX}.session_challange`
const NEON_AUTH_SESSION_COOKIE_NAME = `${NEON_AUTH_COOKIE_PREFIX}.session_token`
export { NEON_AUTH_SESSION_VERIFIER_PARAM }

const PROXY_HEADERS = ['user-agent', 'authorization', 'referer', 'content-type']
const RESPONSE_HEADERS_ALLOWLIST = [
  'content-type',
  'content-length',
  'set-cookie',
  'set-auth-jwt',
  'set-auth-token'
]

interface CookieConfig {
  secret: string
  sessionDataTtl?: number
  domain?: string
  sameSite?: 'strict' | 'lax' | 'none'
}

interface SessionData {
  session: {
    id: string
    userId: string
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
  } | null
  user: {
    id: string
    email: string
    name: string
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
    image?: string | null
  } | null
}

function getCookieConfig(event: H3Event): CookieConfig {
  const config = useRuntimeConfig(event)
  const secret = config.neonAuthCookieSecret as string
  if (!secret || secret.length < 32) {
    throw createError({
      statusCode: 500,
      message: 'NUXT_SESSION_PASSWORD must be at least 32 characters'
    })
  }
  return {
    secret,
    sessionDataTtl: 300,
    sameSite: 'lax'
  }
}

function extractNeonAuthCookies(cookieHeader: string): string {
  if (!cookieHeader) return ''
  const parsed = parseCookies(cookieHeader)
  const parts: string[] = []
  for (const [name, value] of parsed.entries()) {
    if (name.startsWith(NEON_AUTH_COOKIE_PREFIX)) {
      parts.push(`${name}=${value}`)
    }
  }
  return parts.join('; ')
}

function serializeSetCookie(cookie: {
  name: string
  value: string
  path?: string
  domain?: string
  maxAge?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: string
}): string {
  let result = `${cookie.name}=${encodeURIComponent(cookie.value)}`
  if (cookie.path) result += `; Path=${cookie.path}`
  if (cookie.domain) result += `; Domain=${cookie.domain}`
  if (cookie.maxAge !== undefined) result += `; Max-Age=${cookie.maxAge}`
  if (cookie.httpOnly) result += '; HttpOnly'
  if (cookie.secure) result += '; Secure'
  if (cookie.sameSite) {
    const sameSite = cookie.sameSite.charAt(0).toUpperCase() + cookie.sameSite.slice(1)
    result += `; SameSite=${sameSite}`
  }
  return result
}

function parseSetCookies(setCookieHeader: string) {
  const parsedCookies = parseSetCookieHeader(setCookieHeader)
  const cookies: Array<{
    name: string
    value: string
    path?: string
    domain?: string
    maxAge?: number
    httpOnly?: boolean
    secure?: boolean
    sameSite?: string
  }> = []

  for (const [name, parsedCookie] of parsedCookies.entries()) {
    cookies.push({
      name,
      value: decodeURIComponent(parsedCookie.value),
      path: parsedCookie.path,
      domain: parsedCookie.domain,
      maxAge: parsedCookie['max-age'] ?? parsedCookie.maxAge,
      httpOnly: parsedCookie.httponly ?? true,
      secure: parsedCookie.secure ?? true,
      sameSite: parsedCookie.samesite ?? 'lax'
    })
  }
  return cookies
}

function parseSessionData(json: unknown): SessionData {
  if (!json || typeof json !== 'object') {
    return { session: null, user: null }
  }
  const data = json as Record<string, unknown>
  if (!data.session || !data.user) {
    return { session: null, user: null }
  }
  const session = data.session as Record<string, string>
  const user = data.user as Record<string, string>
  return {
    session: {
      ...(data.session as object),
      expiresAt: new Date(session.expiresAt),
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt)
    } as SessionData['session'],
    user: {
      ...(data.user as object),
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    } as SessionData['user']
  }
}

async function signSessionDataCookie(
  sessionData: SessionData,
  secret: string,
  ttlSeconds = 300
) {
  const ttlMs = ttlSeconds * 1000
  const expiresAt = Math.min(
    sessionData.session!.expiresAt.getTime(),
    Date.now() + ttlMs
  )
  const encodedSecret = new TextEncoder().encode(secret)
  const value = await new SignJWT(sessionData as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .setSubject(sessionData.user?.id ?? 'anonymous')
    .sign(encodedSecret)

  return { value, expiresAt: new Date(expiresAt) }
}

async function fetchSessionWithCookie(sessionTokenCookie: string, baseUrl: string) {
  const [name, ...valueParts] = sessionTokenCookie.split(';')[0].trim().split('=')
  const response = await fetch(`${baseUrl}/get-session`, {
    headers: { Cookie: `${name}=${valueParts.join('=')}` }
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch session: ${response.status}`)
  }
  return parseSessionData(await response.json())
}

async function mintSessionDataFromToken(
  sessionTokenCookie: string,
  baseUrl: string,
  cookieConfig: CookieConfig
) {
  const sessionData = await fetchSessionWithCookie(sessionTokenCookie, baseUrl)
  if (!sessionData.session) return null

  const { value, expiresAt } = await signSessionDataCookie(
    sessionData,
    cookieConfig.secret,
    cookieConfig.sessionDataTtl
  )
  const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000)
  return serializeSetCookie({
    name: NEON_AUTH_SESSION_DATA_COOKIE_NAME,
    value,
    path: '/',
    domain: cookieConfig.domain,
    httpOnly: true,
    secure: true,
    sameSite: cookieConfig.sameSite ?? 'lax',
    maxAge
  })
}

async function mintSessionDataFromResponse(
  response: Response,
  baseUrl: string,
  cookieConfig: CookieConfig
) {
  const sessionTokenCookie = response.headers.getSetCookie().find(c => c.includes('session_token'))
  if (!sessionTokenCookie) return null
  if (sessionTokenCookie.toLowerCase().includes('max-age=0')) {
    return serializeSetCookie({
      name: NEON_AUTH_SESSION_DATA_COOKIE_NAME,
      value: '',
      path: '/',
      domain: cookieConfig.domain,
      httpOnly: true,
      secure: true,
      sameSite: cookieConfig.sameSite ?? 'lax',
      maxAge: 0
    })
  }
  return mintSessionDataFromToken(sessionTokenCookie.split(';')[0], baseUrl, cookieConfig)
}

function appendSetCookies(event: H3Event, response: Response, cookieConfig: CookieConfig) {
  const effectiveSameSite = cookieConfig.sameSite ?? 'lax'
  const isHttps = getRequestURL(event).protocol === 'https:'
  for (const cookieHeader of response.headers.getSetCookie()) {
    for (const parsedCookie of parseSetCookies(cookieHeader)) {
      parsedCookie.sameSite = effectiveSameSite
      if (cookieConfig.domain) parsedCookie.domain = cookieConfig.domain
      // __Secure- cookies need Secure on HTTPS; on local HTTP keep Secure for Chromium localhost.
      if (!isHttps && !parsedCookie.name.startsWith('__Secure-')) {
        parsedCookie.secure = false
      }
      appendResponseHeader(event, 'set-cookie', serializeSetCookie(parsedCookie))
    }
  }
}

function toWebRequest(event: H3Event): Request {
  const url = getRequestURL(event)
  const headers = new Headers()
  for (const header of PROXY_HEADERS) {
    const value = getRequestHeader(event, header)
    if (value) headers.set(header, value)
  }
  headers.set('Origin', getRequestURL(event).origin)
  headers.set('Cookie', extractNeonAuthCookies(getRequestHeader(event, 'cookie') ?? ''))
  headers.set('x-neon-auth-middleware', 'true')

  return new Request(url.toString(), {
    method: event.method,
    headers
  })
}

async function handleAuthResponse(
  event: H3Event,
  response: Response,
  baseUrl: string,
  cookieConfig: CookieConfig
) {
  setResponseStatus(event, response.status, response.statusText)
  for (const header of RESPONSE_HEADERS_ALLOWLIST) {
    if (header === 'set-cookie') {
      appendSetCookies(event, response, cookieConfig)
    } else {
      const value = response.headers.get(header)
      if (value) setResponseHeader(event, header, value)
    }
  }

  const sessionDataCookie = await mintSessionDataFromResponse(response, baseUrl, cookieConfig)
  if (sessionDataCookie) {
    appendResponseHeader(event, 'set-cookie', sessionDataCookie)
  }

  return response.body
}

async function trySessionCache(event: H3Event, baseUrl: string, cookieConfig: CookieConfig) {
  const url = getRequestURL(event)
  if (url.searchParams.get('disableCookieCache') === 'true') return null

  const cookieHeader = getRequestHeader(event, 'cookie') ?? ''
  if (!cookieHeader.includes(NEON_AUTH_SESSION_COOKIE_NAME)) return null

  const sessionToken = parseCookies(cookieHeader).get(NEON_AUTH_SESSION_COOKIE_NAME)
  if (!sessionToken) return null

  const sessionDataCookie = await mintSessionDataFromToken(
    `${NEON_AUTH_SESSION_COOKIE_NAME}=${sessionToken}`,
    baseUrl,
    cookieConfig
  )
  if (!sessionDataCookie) return null

  const sessionData = await fetchSessionWithCookie(
    `${NEON_AUTH_SESSION_COOKIE_NAME}=${sessionToken}`,
    baseUrl
  )
  if (!sessionData.session) return null

  setResponseHeader(event, 'content-type', 'application/json')
  appendResponseHeader(event, 'set-cookie', sessionDataCookie)
  return sessionData
}

export async function proxyNeonAuthRequest(event: H3Event, path: string) {
  const config = useRuntimeConfig(event)
  const baseUrl = config.public.neonAuthUrl as string
  if (!baseUrl) {
    throw createError({ statusCode: 503, message: 'Neon Auth is not configured' })
  }

  const cookieConfig = getCookieConfig(event)

  if (path === 'get-session' && event.method === 'GET') {
    const cached = await trySessionCache(event, baseUrl, cookieConfig)
    if (cached) return cached
  }

  const request = toWebRequest(event)
  const upstreamURL = new URL(`${baseUrl.replace(/\/$/, '')}/${path}`)
  upstreamURL.search = getRequestURL(event).search

  const body = ['GET', 'HEAD'].includes(event.method)
    ? undefined
    : await readRawBody(event)

  const resolvedBody = body ?? (path === 'sign-out' && event.method === 'POST' ? '{}' : undefined)

  const headers = new Headers(request.headers)
  if (resolvedBody === '{}' && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const upstream = await fetch(upstreamURL.toString(), {
    method: request.method,
    headers,
    body: resolvedBody
  })

  return handleAuthResponse(event, upstream, baseUrl, cookieConfig)
}

/**
 * Start OAuth and return the provider redirect URL (Google/GitHub).
 * Sets the session challenge cookie on the app origin before redirect.
 */
export async function getSocialOAuthRedirectUrl(
  event: H3Event,
  provider: 'google' | 'github',
  callbackURL: string
): Promise<string> {
  const config = useRuntimeConfig(event)
  const baseUrl = config.public.neonAuthUrl as string
  if (!baseUrl) {
    throw createError({ statusCode: 503, message: 'Neon Auth is not configured' })
  }

  const cookieConfig = getCookieConfig(event)
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')
  headers.set('Origin', getRequestURL(event).origin)
  const userAgent = getRequestHeader(event, 'user-agent')
  if (userAgent) headers.set('User-Agent', userAgent)
  headers.set('Cookie', extractNeonAuthCookies(getRequestHeader(event, 'cookie') ?? ''))

  const upstream = await fetch(`${baseUrl.replace(/\/$/, '')}/sign-in/social`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ provider, callbackURL })
  })

  if (!upstream.ok) {
    const body = await upstream.text().catch(() => '')
    if (import.meta.dev) {
      console.warn('[neon-auth] social sign-in failed:', upstream.status, body)
    }
    throw createError({ statusCode: 502, message: 'OAuth provider unavailable' })
  }

  const data = await upstream.json().catch(() => null) as { url?: string } | null
  if (!data?.url) {
    throw createError({ statusCode: 502, message: 'No OAuth redirect URL returned' })
  }

  appendSetCookies(event, upstream, cookieConfig)
  return data.url
}

export async function tryOAuthSessionExchange(event: H3Event): Promise<string | null> {
  const url = getRequestURL(event)
  const verifier = url.searchParams.get(NEON_AUTH_SESSION_VERIFIER_PARAM)
  if (!verifier) return null

  const cookieHeader = getRequestHeader(event, 'cookie') ?? ''
  const challenge = parseCookies(cookieHeader).get(NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME)
  if (!challenge && import.meta.dev) {
    console.warn('[neon-auth] OAuth verifier present but session challenge cookie is missing — trying exchange anyway')
  }

  const config = useRuntimeConfig(event)
  const baseUrl = config.public.neonAuthUrl as string
  if (!baseUrl) return null

  const cookieConfig = getCookieConfig(event)
  const request = toWebRequest(event)
  const upstreamURL = new URL(`${baseUrl.replace(/\/$/, '')}/get-session`)
  upstreamURL.search = url.search

  const upstream = await fetch(upstreamURL.toString(), {
    method: 'GET',
    headers: request.headers
  })

  if (!upstream.ok) {
    if (import.meta.dev) {
      const body = await upstream.text().catch(() => '')
      console.warn('[neon-auth] OAuth session exchange failed:', upstream.status, body)
    }
    return null
  }

  const sessionData = await upstream.json().catch(() => null) as SessionData | null
  if (!sessionData?.session) return null

  appendSetCookies(event, upstream, cookieConfig)
  const sessionDataCookie = await mintSessionDataFromResponse(upstream, baseUrl, cookieConfig)
  if (sessionDataCookie) {
    appendResponseHeader(event, 'set-cookie', sessionDataCookie)
  }

  url.searchParams.delete(NEON_AUTH_SESSION_VERIFIER_PARAM)
  return url.toString()
}

export async function getSessionFromEvent(event: H3Event): Promise<SessionData | null> {
  const cookieHeader = getRequestHeader(event, 'cookie') ?? ''
  const sessionDataCookie = parseCookies(cookieHeader).get(NEON_AUTH_SESSION_DATA_COOKIE_NAME)
  const config = useRuntimeConfig(event)
  const cookieConfig = getCookieConfig(event)

  if (sessionDataCookie) {
    try {
      const { payload } = await jwtVerify(
        sessionDataCookie,
        new TextEncoder().encode(cookieConfig.secret),
        { algorithms: ['HS256'] }
      )
      const sessionData = parseSessionData(payload)
      if (sessionData.session) return sessionData
    } catch {
      // fall through to upstream
    }
  }

  const sessionToken = parseCookies(cookieHeader).get(NEON_AUTH_SESSION_COOKIE_NAME)
  if (!sessionToken) return null

  const baseUrl = config.public.neonAuthUrl as string
  if (!baseUrl) return null

  try {
    return await fetchSessionWithCookie(
      `${NEON_AUTH_SESSION_COOKIE_NAME}=${sessionToken}`,
      baseUrl
    )
  } catch {
    return null
  }
}
