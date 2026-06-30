// ANCHOR: Budget data access
import type { BudgetPeriod, TransactionCategory } from '~~/generated/prisma/client'
import type { SpaceContext } from '../domain/context'

export async function listBudgetsForUser(ctx: SpaceContext) {
  return prisma.budget.findMany({
    where: {
      spaceId: ctx.spaceId,
      OR: [{ isShared: true }, { userId: ctx.userId }]
    },
    orderBy: { createdAt: 'asc' }
  })
}

export function mapBudgetDto(
  budget: Awaited<ReturnType<typeof listBudgetsForUser>>[number],
  currency: string,
  spent: number,
  viewerId: string
) {
  return {
    id: budget.id,
    name: budget.name,
    category: budget.category,
    amount: Number(budget.amount),
    currency,
    spent,
    period: budget.period,
    isShared: budget.isShared,
    isMine: budget.userId === viewerId
  }
}

export type { BudgetPeriod }

export async function findBudgetInSpace(budgetId: string, spaceId: string) {
  return prisma.budget.findFirst({
    where: { id: budgetId, spaceId }
  })
}

export async function createBudget(data: {
  userId: string
  spaceId: string
  name: string
  category: TransactionCategory
  amount: number
  period: BudgetPeriod
  isShared: boolean
  startDate: Date
}) {
  return prisma.budget.create({ data })
}

export async function updateBudget(
  budgetId: string,
  data: {
    name: string
    category: TransactionCategory
    amount: number
    period: BudgetPeriod
    isShared: boolean
  }
) {
  return prisma.budget.update({ where: { id: budgetId }, data })
}

export async function deleteBudget(budgetId: string) {
  await prisma.budget.delete({ where: { id: budgetId } })
}
