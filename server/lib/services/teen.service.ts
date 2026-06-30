// ANCHOR: Teen dashboard service — jars, allowance, learn mode
import type { TeenDashboardDto } from '#shared/api/teen'
import { isMinorRole } from '#shared/space-roles'
import type { SpaceContext } from '../domain/context'
import { findTeenJars } from '../repositories/space.repository'

export interface TeenDashboardMembership {
  role: string
  name: string | null
  childProfile?: {
    id: string
    allowance: unknown
    frequency: string | null
    learnMode: boolean
    limits: unknown
  } | null
}

export function assertTeenDashboardAccess(membership: { role: string }) {
  if (!isMinorRole(membership.role)) {
    throw createError({ statusCode: 403, message: 'Teen dashboard only' })
  }
}

export async function getTeenDashboard(
  ctx: SpaceContext,
  membership: TeenDashboardMembership
): Promise<TeenDashboardDto> {
  assertTeenDashboardAccess(membership)

  const profile = membership.childProfile
  if (!profile) {
    throw createError({ statusCode: 404, message: 'Profile not found' })
  }

  const jars = await findTeenJars(profile.id)
  const totalSaved = jars.reduce((sum, jar) => sum + Number(jar.balance), 0)

  return {
    name: membership.name ?? ctx.userName,
    role: membership.role,
    learnMode: profile.learnMode,
    allowance: profile.allowance ? Number(profile.allowance) : null,
    frequency: profile.frequency,
    limits: profile.limits,
    jars: jars.map(jar => ({
      id: jar.id,
      name: jar.name,
      balance: Number(jar.balance),
      target: jar.target ? Number(jar.target) : null,
      progress: jar.target ? Math.min(100, (Number(jar.balance) / Number(jar.target)) * 100) : null
    })),
    totalSaved
  }
}
