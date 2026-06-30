// ANCHOR: Member financial drill-down service
import type { MemberFinancialDto } from '#shared/api/family'
import type { SpaceContext } from '../domain/context'
import { assertGuardianCanViewMember } from '../domain/space-guard'
import { createFxConverter } from '../fx/converter'
import { spendingIncomeInRange } from '../repositories/transaction.repository'
import { canManageMembers } from '../../utils/spaceAuth'

export async function getMemberFinancial(
  ctx: SpaceContext,
  routeSpaceId: string,
  memberId: string,
  displayCurrency: string
): Promise<MemberFinancialDto> {
  assertGuardianCanViewMember(ctx.role, ctx.spaceType, canManageMembers)
  const fx = await createFxConverter(displayCurrency)

  const member = await prisma.spaceMember.findFirst({
    where: { id: memberId, spaceId: routeSpaceId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      childProfile: { include: { jars: true } }
    }
  })

  if (!member) {
    throw createError({ statusCode: 404, message: 'Member not found' })
  }

  if (!member.userId) {
    return {
      member: {
        id: member.id,
        name: member.name ?? member.email,
        email: member.email,
        role: member.role,
        status: member.status,
        birthday: member.birthday?.toISOString() ?? null,
        hasAccount: false
      },
      accounts: [],
      transactions: [],
      stats: { balance: 0, spending30d: 0, income30d: 0, transactionCount: 0, currency: displayCurrency }
    }
  }

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [accounts, transactions, txCount30d] = await Promise.all([
    prisma.account.findMany({
      where: { spaceId: routeSpaceId, userId: member.userId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        institution: true,
        type: true,
        visibility: true,
        balance: true,
        currency: true,
        syncedAt: true
      }
    }),
    prisma.transaction.findMany({
      where: { spaceId: routeSpaceId, userId: member.userId },
      orderBy: { date: 'desc' },
      take: 30,
      include: { account: { select: { id: true, name: true } } }
    }),
    prisma.transaction.count({
      where: { spaceId: routeSpaceId, userId: member.userId, date: { gte: since } }
    })
  ])

  const accountIds = accounts.map(account => account.id)
  const monthlySplit = accountIds.length
    ? await spendingIncomeInRange(routeSpaceId, since, undefined, accountIds)
    : { spendingByCurrency: [], incomeByCurrency: [] }

  const income30d = fx.sum(monthlySplit.incomeByCurrency.map(row => ({
    amount: row.amount,
    currency: row.currency
  })))
  const spending30d = fx.sum(monthlySplit.spendingByCurrency.map(row => ({
    amount: row.amount,
    currency: row.currency
  })))
  const balance = fx.sum(accounts.map(account => ({
    amount: Number(account.balance),
    currency: account.currency
  })))

  return {
    member: {
      id: member.id,
      userId: member.userId,
      name: member.user?.name ?? member.name ?? member.email,
      email: member.user?.email ?? member.email,
      role: member.role,
      status: member.status,
      birthday: member.birthday?.toISOString() ?? null,
      hasAccount: true,
      childProfile: member.childProfile
        ? {
            id: member.childProfile.id,
            allowance: member.childProfile.allowance ? Number(member.childProfile.allowance) : null,
            frequency: member.childProfile.frequency,
            learnMode: member.childProfile.learnMode,
            jars: member.childProfile.jars.map(jar => ({
              id: jar.id,
              name: jar.name,
              balance: Number(jar.balance),
              target: jar.target ? Number(jar.target) : null
            }))
          }
        : null
    },
    accounts: accounts.map(account => ({
      id: account.id,
      name: account.name,
      institution: account.institution,
      type: account.type,
      visibility: account.visibility,
      balance: Number(account.balance),
      currency: account.currency,
      syncedAt: account.syncedAt?.toISOString() ?? null
    })),
    transactions: transactions.map(tx => ({
      id: tx.id,
      description: tx.description,
      merchant: tx.merchant,
      amount: Number(tx.amount),
      currency: tx.currency,
      category: tx.category,
      date: tx.date.toISOString(),
      pending: tx.pending,
      account: tx.account
    })),
    stats: {
      balance: Math.round(balance * 100) / 100,
      spending30d: Math.round(spending30d * 100) / 100,
      income30d: Math.round(income30d * 100) / 100,
      transactionCount: txCount30d,
      currency: displayCurrency
    }
  }
}
