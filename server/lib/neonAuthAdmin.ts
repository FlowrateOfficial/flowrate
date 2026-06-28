// ANCHOR: Neon Auth admin API — delete users (guardian/self-serve)
import type { H3Event } from 'h3'
import { extractNeonAuthCookies } from '../utils/neonAuthProxy'

let cachedBranchId: string | null = null

async function resolveNeonBranchId(event?: H3Event): Promise<string> {
  const config = useRuntimeConfig(event)
  const configured = config.neonBranchId as string | undefined
  if (configured) return configured
  if (cachedBranchId) return cachedBranchId

  const projectId = config.stackProjectId as string | undefined
  const apiKey = config.neonApiKey as string | undefined
  if (!projectId || !apiKey) {
    throw createError({
      statusCode: 503,
      message: 'Neon admin API is not configured (STACK_PROJECT_ID and NEON_API_KEY required for guardian account deletion)'
    })
  }

  const response = await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw createError({ statusCode: 502, message: 'Failed to resolve Neon branch for auth user deletion' })
  }

  const data = await response.json() as {
    branches?: Array<{ id: string, primary?: boolean, default?: boolean }>
  }
  const branch = data.branches?.find(b => b.primary || b.default) ?? data.branches?.[0]
  if (!branch?.id) {
    throw createError({ statusCode: 502, message: 'No Neon branch found for auth user deletion' })
  }

  cachedBranchId = branch.id
  return branch.id
}

export async function deleteNeonAuthUserByAdmin(userId: string, event?: H3Event): Promise<void> {
  const config = useRuntimeConfig(event)
  const projectId = config.stackProjectId as string | undefined
  const apiKey = config.neonApiKey as string | undefined
  if (!projectId || !apiKey) {
    throw createError({
      statusCode: 503,
      message: 'Neon admin API is not configured'
    })
  }

  const branchId = await resolveNeonBranchId(event)
  const url = `https://console.neon.tech/api/v2/projects/${projectId}/branches/${branchId}/auth/users/${userId}`

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json'
    }
  })

  if (response.status === 404) return
  if (!response.ok && response.status !== 204) {
    const body = await response.text().catch(() => '')
    console.error('[neonAuthAdmin] delete user failed:', response.status, body)
    throw createError({ statusCode: 502, message: 'Failed to delete login account' })
  }
}

export async function deleteNeonAuthUserSelf(
  event: H3Event,
  password?: string
): Promise<void> {
  const config = useRuntimeConfig(event)
  const baseUrl = config.public.neonAuthUrl as string
  if (!baseUrl) {
    throw createError({ statusCode: 503, message: 'Authentication is not configured' })
  }

  const cookieHeader = getRequestHeader(event, 'cookie') ?? ''
  const origin = getRequestURL(event).origin

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/delete-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      Referer: `${origin}/`,
      Cookie: extractNeonAuthCookies(cookieHeader)
    },
    body: JSON.stringify(password ? { password } : {})
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { message?: string }
    const message = data.message ?? 'Failed to delete login account'
    if (message.toLowerCase().includes('password')) {
      throw createError({ statusCode: 400, message: 'Password is required or incorrect' })
    }
    throw createError({ statusCode: 400, message })
  }
}
