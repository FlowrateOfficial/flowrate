// ANCHOR: Space detail data access
import type { Prisma, SpaceRole } from '~~/generated/prisma/client'

export type SpaceDetailView = 'team' | 'guardians' | 'children' | ''

export async function findMembersForTeamView(spaceId: string, view: 'team' | 'guardians') {
  return prisma.spaceMember.findMany({
    where: {
      spaceId,
      ...(view === 'guardians' ? { role: { notIn: ['CHILD', 'TEEN'] as SpaceRole[] } } : {})
    },
    select: {
      id: true,
      userId: true,
      email: true,
      name: true,
      role: true,
      status: true,
      user: { select: { email: true, name: true } }
    },
    orderBy: { createdAt: 'asc' }
  })
}

export async function findMembersForFamilyView(spaceId: string, view: SpaceDetailView) {
  return prisma.spaceMember.findMany({
    where: {
      spaceId,
      ...(view === 'children' ? { role: { in: ['CHILD', 'TEEN'] as SpaceRole[] } } : {})
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      childProfile: { include: { jars: true } }
    },
    orderBy: { createdAt: 'asc' }
  })
}

export async function findMembersList(spaceId: string) {
  return prisma.spaceMember.findMany({
    where: { spaceId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      childProfile: true
    },
    orderBy: { createdAt: 'asc' }
  })
}

export async function findSpaceAccountsSummary(
  spaceId: string,
  accountWhere: Prisma.AccountWhereInput
) {
  return prisma.account.findMany({
    where: { spaceId, ...accountWhere },
    select: { id: true, name: true, balance: true, visibility: true, userId: true, type: true }
  })
}

export async function summarizeChildFinances(spaceId: string, childUserIds: string[]) {
  const summaries = new Map<string, { balance: number, spending30d: number, accountCount: number }>()
  if (!childUserIds.length) return summaries

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [childAccounts, childSpendingTxs] = await Promise.all([
    prisma.account.findMany({
      where: { spaceId, userId: { in: childUserIds } },
      select: { userId: true, balance: true }
    }),
    prisma.transaction.findMany({
      where: {
        spaceId,
        userId: { in: childUserIds },
        date: { gte: since },
        amount: { lt: 0 }
      },
      select: { userId: true, amount: true }
    })
  ])

  for (const userId of childUserIds) {
    const accountsForChild = childAccounts.filter(account => account.userId === userId)
    const spending30d = childSpendingTxs
      .filter(tx => tx.userId === userId)
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)

    summaries.set(userId, {
      balance: accountsForChild.reduce((sum, account) => sum + Number(account.balance), 0),
      spending30d,
      accountCount: accountsForChild.length
    })
  }

  return summaries
}

export async function findTeenJars(childProfileId: string) {
  return prisma.allowanceJar.findMany({
    where: { childId: childProfileId },
    orderBy: { createdAt: 'asc' }
  })
}

export async function listSplitRules(spaceId: string) {
  return prisma.splitRule.findMany({
    where: { spaceId },
    orderBy: { createdAt: 'asc' }
  })
}

export async function createSplitRule(
  spaceId: string,
  data: { name: string, category?: string, mode: string, splits: Record<string, number> }
) {
  return prisma.splitRule.create({
    data: {
      spaceId,
      name: data.name,
      category: data.category as import('~~/generated/prisma/client').TransactionCategory | undefined,
      mode: data.mode as import('~~/generated/prisma/client').SplitRuleType,
      splits: data.splits
    }
  })
}

export async function findMemberInSpace(memberId: string, spaceId: string) {
  return prisma.spaceMember.findFirst({
    where: { id: memberId, spaceId }
  })
}

export async function findMemberWithChildProfile(memberId: string, spaceId: string) {
  return prisma.spaceMember.findFirst({
    where: { id: memberId, spaceId },
    include: { childProfile: { include: { jars: true } } }
  })
}

export async function deleteMemberInvitations(spaceId: string, email: string) {
  await prisma.spaceInvitation.deleteMany({
    where: { spaceId, email: email.toLowerCase() }
  })
}

export async function deleteSpaceMember(memberId: string) {
  await prisma.spaceMember.delete({ where: { id: memberId } })
}

export async function updateChildProfile(
  childProfileId: string,
  data: {
    allowance?: number
    frequency?: string
    learnMode?: boolean
    limits?: Record<string, number>
  }
) {
  return prisma.childProfile.update({
    where: { id: childProfileId },
    data: {
      allowance: data.allowance,
      frequency: data.frequency as import('~~/generated/prisma/client').BudgetPeriod | undefined,
      learnMode: data.learnMode,
      limits: data.limits ?? undefined
    },
    include: { jars: true }
  })
}

export async function createSavingsJar(
  childProfileId: string,
  data: { name: string, target?: number }
) {
  return prisma.allowanceJar.create({
    data: {
      childId: childProfileId,
      name: data.name,
      target: data.target,
      balance: 0
    }
  })
}

export async function findInvitationByToken(token: string) {
  return prisma.spaceInvitation.findUnique({
    where: { token },
    include: { space: { select: { id: true, name: true, type: true } } }
  })
}

export async function findPlaidLinkByRef(ref: string) {
  return prisma.plaidLink.findUnique({ where: { ref } })
}

export async function findPlaidLinkByRefOnly(ref: string) {
  return prisma.plaidLink.findUnique({ where: { ref }, select: { id: true, userId: true } })
}

export async function deleteAccountsByStripeId(stripeId: string) {
  await prisma.account.deleteMany({ where: { stripeId } })
}

export async function findAccountByStripeId(stripeId: string) {
  return prisma.account.findUnique({ where: { stripeId } })
}

export async function findActiveSubscriptionId(userId: string) {
  const billing = await prisma.userBilling.findUnique({
    where: { userId },
    select: {
      subscription: {
        select: { subId: true, status: true }
      }
    }
  })

  const status = billing?.subscription?.status
  if (status === 'ACTIVE' || status === 'TRIALING') {
    return billing?.subscription?.subId ?? null
  }
  return null
}

