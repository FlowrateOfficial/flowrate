import type { AccountVisibility, Prisma } from '~/generated/prisma'
import type { SpaceContext } from '../domain/context'

export type AccountListFilter = 'all' | 'shared' | 'personal' | 'mine'

export function accountWhereForSpace(
  ctx: SpaceContext,
  filter: AccountListFilter = 'all'
): Prisma.AccountWhereInput {
  const base = { spaceId: ctx.spaceId }

  switch (filter) {
    case 'shared':
      return { ...base, visibility: 'SHARED' }
    case 'personal':
      return { ...base, userId: ctx.userId, visibility: 'PERSONAL' }
    case 'mine':
      return { ...base, userId: ctx.userId }
    case 'all':
    default:
      if (ctx.spaceType === 'COMPANY') {
        return base
      }
      if (ctx.role === 'CHILD') {
        return { ...base, visibility: 'SHARED' }
      }
      if (ctx.role === 'TEEN') {
        return {
          ...base,
          OR: [
            { userId: ctx.userId, visibility: 'PERSONAL' },
            { visibility: 'SHARED' }
          ]
        }
      }
      return {
        ...base,
        OR: [
          { visibility: 'SHARED' },
          { userId: ctx.userId, visibility: 'PERSONAL' }
        ]
      }
  }
}

export async function listAccounts(ctx: SpaceContext, filter: AccountListFilter = 'all') {
  return prisma.account.findMany({
    where: accountWhereForSpace(ctx, filter),
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true, email: true } } }
  })
}

export async function findAccountInSpace(accountId: string, spaceId: string) {
  return prisma.account.findFirst({
    where: { id: accountId, spaceId }
  })
}

export async function deleteAccountCascade(accountId: string) {
  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { accountId } }),
    prisma.account.delete({ where: { id: accountId } })
  ])
}

export async function countLinkedAccounts(spaceId: string) {
  return prisma.account.count({
    where: { spaceId, stripeFcAccountId: { not: null } }
  })
}

export async function sumBalances(spaceId: string, where?: Prisma.AccountWhereInput) {
  const accounts = await prisma.account.findMany({
    where: { spaceId, ...where },
    select: { balance: true, visibility: true, userId: true }
  })

  return {
    total: accounts.reduce((s, a) => s + Number(a.balance), 0),
    shared: accounts.filter(a => a.visibility === 'SHARED').reduce((s, a) => s + Number(a.balance), 0),
    personal: accounts.filter(a => a.visibility === 'PERSONAL').reduce((s, a) => s + Number(a.balance), 0),
    count: accounts.length
  }
}
