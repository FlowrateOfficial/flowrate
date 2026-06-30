// ANCHOR: Neon Auth user deletion — session delete + admin API across auth branches
import type { H3Event } from 'h3'
import { prisma } from '../utils/prisma'
import {
  clearNeonAuthCookies,
  deleteNeonAuthUserUpstream,
  getUpstreamSessionFromEvent
} from '../utils/neonAuthProxy'

const NEON_API_BASE = 'https://console.neon.tech/api/v2'

interface NeonAdminConfig {
  projectId: string
  apiKey: string
  authUrl: string
  configuredBranchId?: string
}

export interface DeleteNeonAuthUserOptions {
  password?: string
  email?: string
  /** Use Better Auth session delete-user (credential accounts only). */
  useSessionDelete?: boolean
}

function normalizeAuthUrl(url: string): string {
  return url.trim().replace(/\/$/, '')
}

function requireNeonAdminConfig(event?: H3Event): NeonAdminConfig {
  const config = useRuntimeConfig(event)
  const projectId = config.stackProjectId as string | undefined
  const apiKey = config.neonApiKey as string | undefined
  const authUrl = normalizeAuthUrl(config.public.neonAuthUrl as string || '')
  const configuredBranchId = (config.neonBranchId as string | undefined)?.trim() || undefined

  if (!projectId || !apiKey) {
    throw createError({
      statusCode: 503,
      message: 'Neon admin API is not configured (STACK_PROJECT_ID and NEON_API_KEY required)'
    })
  }

  return { projectId, apiKey, authUrl, configuredBranchId }
}

function neonAdminHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json'
  }
}

async function neonAdminFetch(
  url: string,
  apiKey: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      ...neonAdminHeaders(apiKey),
      ...(init.headers as Record<string, string> | undefined)
    }
  })
}

async function listProjectBranches(
  projectId: string,
  apiKey: string
): Promise<Array<{ id: string, primary?: boolean, default?: boolean }>> {
  const response = await neonAdminFetch(`${NEON_API_BASE}/projects/${projectId}/branches`, apiKey)
  if (!response.ok) {
    throw createError({ statusCode: 502, message: 'Failed to list Neon branches for auth user deletion' })
  }

  const data = await response.json() as {
    branches?: Array<{ id: string, primary?: boolean, default?: boolean }>
  }
  return data.branches ?? []
}

async function branchAuthBaseUrl(
  projectId: string,
  branchId: string,
  apiKey: string
): Promise<string | null> {
  const response = await neonAdminFetch(
    `${NEON_API_BASE}/projects/${projectId}/branches/${branchId}/auth`,
    apiKey
  )
  if (!response.ok) return null

  const data = await response.json() as { base_url?: string }
  return data.base_url ? normalizeAuthUrl(data.base_url) : null
}

export async function resolveNeonAuthBranchIds(event?: H3Event): Promise<string[]> {
  const { projectId, apiKey, authUrl, configuredBranchId } = requireNeonAdminConfig(event)
  const branchIds: string[] = []

  if (configuredBranchId) branchIds.push(configuredBranchId)

  const branches = await listProjectBranches(projectId, apiKey)

  if (authUrl) {
    for (const branch of branches) {
      if (branchIds.includes(branch.id)) continue
      const baseUrl = await branchAuthBaseUrl(projectId, branch.id, apiKey)
      if (baseUrl === authUrl) branchIds.push(branch.id)
    }
  }

  if (!branchIds.length) {
    const fallback = branches.find(branch => branch.primary || branch.default) ?? branches[0]
    if (fallback?.id) branchIds.push(fallback.id)
  }

  return [...new Set(branchIds)]
}

type DeleteResult = 'deleted' | 'not_found'

async function deleteNeonAuthUserOnBranch(
  projectId: string,
  branchId: string,
  userId: string,
  apiKey: string
): Promise<DeleteResult> {
  const response = await neonAdminFetch(
    `${NEON_API_BASE}/projects/${projectId}/branches/${branchId}/auth/users/${userId}`,
    apiKey,
    { method: 'DELETE' }
  )

  if (response.status === 204 || response.status === 200) return 'deleted'
  if (response.status === 404) return 'not_found'

  const body = await response.text().catch(() => '')
  console.error('[neonAuthAdmin] branch delete failed:', branchId, response.status, body)
  throw createError({ statusCode: 502, message: 'Failed to delete login account' })
}

async function deleteNeonAuthUserOnProject(
  projectId: string,
  userId: string,
  apiKey: string
): Promise<DeleteResult> {
  const response = await neonAdminFetch(
    `${NEON_API_BASE}/projects/${projectId}/auth/users/${userId}`,
    apiKey,
    { method: 'DELETE' }
  )

  if (response.status === 204 || response.status === 200) return 'deleted'
  if (response.status === 404) return 'not_found'

  const body = await response.text().catch(() => '')
  console.error('[neonAuthAdmin] project delete failed:', response.status, body)
  throw createError({ statusCode: 502, message: 'Failed to delete login account' })
}

export async function deleteNeonAuthUserByAdmin(userId: string, event?: H3Event): Promise<boolean> {
  const { projectId, apiKey } = requireNeonAdminConfig(event)
  const branchIds = await resolveNeonAuthBranchIds(event)

  for (const branchId of branchIds) {
    const result = await deleteNeonAuthUserOnBranch(projectId, branchId, userId, apiKey)
    if (result === 'deleted') return true
  }

  const projectResult = await deleteNeonAuthUserOnProject(projectId, userId, apiKey)
  return projectResult === 'deleted'
}

async function findNeonAuthUserIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  const queries = [
    `SELECT id::text AS id FROM neon_auth."user" WHERE lower(email) = $1 LIMIT 1`,
    `SELECT id::text AS id FROM neon_auth.users_sync WHERE lower(email) = $1 LIMIT 1`
  ]

  for (const sql of queries) {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(sql, normalized)
      if (rows[0]?.id) return rows[0].id
    } catch {
      // NOTE - schema/table may differ between Neon Auth versions
    }
  }

  return null
}

async function neonAuthUserExistsByEmail(email: string): Promise<boolean> {
  return (await findNeonAuthUserIdByEmail(email)) != null
}

export async function deleteNeonAuthUserByEmail(email: string, event?: H3Event): Promise<boolean> {
  const authUserId = await findNeonAuthUserIdByEmail(email)
  if (!authUserId) return false
  return deleteNeonAuthUserByAdmin(authUserId, event)
}

async function isNeonAuthUserActive(event: H3Event, userId: string): Promise<boolean> {
  const session = await getUpstreamSessionFromEvent(event)
  return session?.user?.id === userId
}

async function assertNeonAuthUserRemoved(
  event: H3Event,
  userId: string,
  email?: string
): Promise<void> {
  if (!(await isNeonAuthUserActive(event, userId))) {
    clearNeonAuthCookies(event)
    return
  }

  if (email && !(await neonAuthUserExistsByEmail(email))) {
    clearNeonAuthCookies(event)
    return
  }

  throw createError({
    statusCode: 502,
    message: 'Could not delete your login account. Your FlowRate data was not removed.'
  })
}

// NOTE - Credential: session delete-user; OAuth: admin API (+ email lookup fallback)
export async function deleteNeonAuthUser(
  event: H3Event,
  userId: string,
  options: DeleteNeonAuthUserOptions = {}
): Promise<void> {
  const { password, email, useSessionDelete = Boolean(password) } = options

  if (useSessionDelete) {
    try {
      await deleteNeonAuthUserUpstream(event, password)
      clearNeonAuthCookies(event)
      return
    } catch (selfError) {
      console.warn('[neonAuthAdmin] session delete failed, trying admin API:', selfError)
    }
  }

  let deleted = await deleteNeonAuthUserByAdmin(userId, event)

  if (!deleted && email) {
    deleted = await deleteNeonAuthUserByEmail(email, event)
  }

  if (deleted) {
    clearNeonAuthCookies(event)
    return
  }

  await assertNeonAuthUserRemoved(event, userId, email)
}
