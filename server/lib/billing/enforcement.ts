import type { AppPlan } from '#shared/billing'
import { limitsForPlan, planHasFeature, type PlanFeature } from '#shared/plan-limits'

export const PLAN_LIMIT_CODES = {
  BANKS: 'PLAN_LIMIT_BANKS',
  SPACES: 'PLAN_LIMIT_SPACES',
  SPACE_TYPE: 'PLAN_LIMIT_SPACE_TYPE',
  SYNC_COOLDOWN: 'PLAN_LIMIT_SYNC_COOLDOWN',
  SAAS_SHIELD: 'PLAN_LIMIT_SAAS_SHIELD',
  TEEN_ACCOUNTS: 'PLAN_LIMIT_TEEN_ACCOUNTS',
  COMPANY_TEAM: 'PLAN_LIMIT_COMPANY_TEAM',
  COMPANY_MEMBERS: 'PLAN_LIMIT_COMPANY_MEMBERS',
  AUDIT_EXPORT: 'PLAN_LIMIT_AUDIT_EXPORT'
} as const

function planLimitError(
  statusCode: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>
) {
  throw createError({
    statusCode,
    statusMessage: code,
    message,
    data: { code, message, ...extra }
  })
}

// NOTE - Plaid items + one Stripe FC bundle count as one link
export async function countUserBankConnections(userId: string): Promise<number> {
  const [plaidLinks, stripeAccounts] = await Promise.all([
    prisma.plaidLink.count({ where: { userId } }),
    prisma.account.count({ where: { userId, stripeId: { not: null } } })
  ])
  const stripeBundle = stripeAccounts > 0 ? 1 : 0
  return plaidLinks + stripeBundle
}

export async function getUserPlanLimits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true }
  })
  const plan = (user?.plan ?? 'FREE') as AppPlan
  return { plan, limits: limitsForPlan(plan) }
}

export async function userPlanForId(userId: string): Promise<AppPlan> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true }
  })
  return (user?.plan ?? 'FREE') as AppPlan
}

export function assertPlanFeature(plan: AppPlan, feature: PlanFeature, code: string, message: string) {
  if (!planHasFeature(plan, feature)) {
    planLimitError(402, code, message, { plan, feature })
  }
}

export async function assertCanConnectBank(userId: string, plan?: AppPlan) {
  const resolved = plan ?? (await getUserPlanLimits(userId)).plan
  const { bankConnections } = limitsForPlan(resolved)
  if (bankConnections == null) return

  const current = await countUserBankConnections(userId)
  if (current >= bankConnections) {
    planLimitError(
      402,
      PLAN_LIMIT_CODES.BANKS,
      'Upgrade to Pro to connect more bank accounts',
      { current, limit: bankConnections, plan: resolved }
    )
  }
}

export async function assertCanCreateSpace(
  userId: string,
  spaceType: 'HOUSEHOLD' | 'FAMILY' | 'COMPANY',
  plan?: AppPlan
) {
  const resolved = plan ?? (await getUserPlanLimits(userId)).plan
  const limits = limitsForPlan(resolved)

  if (!limits.sharedSpaces) {
    planLimitError(
      402,
      PLAN_LIMIT_CODES.SPACE_TYPE,
      'Household, Family, and Business spaces require a Pro plan',
      { plan: resolved, spaceType }
    )
  }

  if (limits.spaces == null) return

  const existingSpaces = await prisma.spaceMember.count({
    where: { userId, status: 'ACTIVE' }
  })

  if (existingSpaces >= limits.spaces) {
    planLimitError(
      402,
      PLAN_LIMIT_CODES.SPACES,
      'Upgrade to Pro to create additional financial spaces',
      { current: existingSpaces, limit: limits.spaces, plan: resolved }
    )
  }
}

// NOTE - Pure sync cooldown — returns remaining ms (0 = allowed)
export function syncCooldownRemainingMs(
  lastSyncAt: Date | null | undefined,
  intervalHours: number,
  now = Date.now()
): number {
  if (!intervalHours || !lastSyncAt) return 0
  const cooldownMs = intervalHours * 60 * 60 * 1000
  const elapsed = now - lastSyncAt.getTime()
  return Math.max(0, cooldownMs - elapsed)
}

export async function assertCanManualSync(userId: string, plan?: AppPlan) {
  const resolved = plan ?? (await getUserPlanLimits(userId)).plan
  const { manualSyncIntervalHours } = limitsForPlan(resolved)
  if (!manualSyncIntervalHours) return

  const usage = await prisma.userUsage.findUnique({ where: { userId } })
  const remaining = syncCooldownRemainingMs(usage?.lastSyncAt, manualSyncIntervalHours)
  if (remaining > 0) {
    const retryAfterSec = Math.ceil(remaining / 1000)
    planLimitError(
      429,
      PLAN_LIMIT_CODES.SYNC_COOLDOWN,
      `Free plan sync is limited to once every ${manualSyncIntervalHours} hours`,
      { retryAfterSec, plan: resolved }
    )
  }
}

export async function assertSaasShield(userId: string, plan?: AppPlan) {
  const resolved = plan ?? (await getUserPlanLimits(userId)).plan
  assertPlanFeature(
    resolved,
    'saasShield',
    PLAN_LIMIT_CODES.SAAS_SHIELD,
    'SaaS Shield and burn-rate metrics require a Pro plan'
  )
}

export async function assertTeenAccounts(userId: string, plan?: AppPlan) {
  const resolved = plan ?? (await getUserPlanLimits(userId)).plan
  assertPlanFeature(
    resolved,
    'teenAccounts',
    PLAN_LIMIT_CODES.TEEN_ACCOUNTS,
    'Teen and child accounts require a Pro plan'
  )
}

export async function assertCompanyTeamInvite(userId: string, plan?: AppPlan) {
  const resolved = plan ?? (await getUserPlanLimits(userId)).plan
  assertPlanFeature(
    resolved,
    'companyTeam',
    PLAN_LIMIT_CODES.COMPANY_TEAM,
    'Company team invites require an Enterprise plan'
  )
}

export async function assertCompanyMemberCapacity(spaceId: string, plan?: AppPlan) {
  const limits = limitsForPlan(plan ?? 'FREE')
  if (!limits.companyMemberLimit) return

  const memberCount = await prisma.spaceMember.count({
    where: { spaceId, status: 'ACTIVE' }
  })

  if (memberCount >= limits.companyMemberLimit) {
    planLimitError(
      402,
      PLAN_LIMIT_CODES.COMPANY_MEMBERS,
      `Enterprise company spaces support up to ${limits.companyMemberLimit} members`,
      { current: memberCount, limit: limits.companyMemberLimit }
    )
  }
}

export async function assertAuditExport(userId: string, plan?: AppPlan) {
  const resolved = plan ?? (await getUserPlanLimits(userId)).plan
  assertPlanFeature(
    resolved,
    'auditExport',
    PLAN_LIMIT_CODES.AUDIT_EXPORT,
    'Audit-ready exports require an Enterprise plan'
  )
}

export async function recordManualSync(userId: string) {
  const monthKey = new Date().toISOString().slice(0, 7)
  const now = new Date()
  const existing = await prisma.userUsage.findUnique({ where: { userId } })

  const syncCountMonth = !existing || existing.syncMonthKey !== monthKey
    ? 1
    : existing.syncCountMonth + 1

  await prisma.userUsage.upsert({
    where: { userId },
    create: {
      userId,
      syncCountMonth: 1,
      syncMonthKey: monthKey,
      lastSyncAt: now
    },
    update: {
      syncCountMonth,
      syncMonthKey: monthKey,
      lastSyncAt: now
    }
  })
}

// NOTE - Webhook sync is Pro+ only; free users manual sync
export function allowsWebhookSync(plan: AppPlan): boolean {
  return plan !== 'FREE'
}
