// ANCHOR: Teen dashboard service — jars, allowance, learn mode, spending nudges
import type { TeenDashboardDto, TeenSpendingNudgeDto } from '#shared/api/teen'
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

function parseLimits(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'number' && value > 0) out[key] = value
  }
  return out
}

async function buildSpendingNudges(
  ctx: SpaceContext,
  limits: Record<string, number>
): Promise<TeenSpendingNudgeDto[]> {
  if (!Object.keys(limits).length) return []

  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const rows = await prisma.transaction.groupBy({
    by: ['category'],
    where: {
      spaceId: ctx.spaceId,
      userId: ctx.userId,
      date: { gte: start },
      amount: { lt: 0 }
    },
    _sum: { amount: true }
  })

  const nudges: TeenSpendingNudgeDto[] = []
  for (const [category, limit] of Object.entries(limits)) {
    const row = rows.find(r => r.category === category)
    const spent = Math.abs(Number(row?._sum.amount ?? 0))
    const percent = Math.round((spent / limit) * 100)
    if (percent >= 80) {
      nudges.push({ category, spent, limit, percent })
    }
  }

  return nudges.sort((a, b) => b.percent - a.percent)
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
  const limits = parseLimits(profile.limits)
  const nudges = profile.learnMode ? await buildSpendingNudges(ctx, limits) : []

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
    totalSaved,
    nudges
  }
}
