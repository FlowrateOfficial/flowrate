// ANCHOR: Savings goals for adults
import type { SpaceContext } from '../domain/context'

export interface SavingsGoalDto {
  id: string
  name: string
  balance: number
  target: number | null
  currency: string
  progress: number | null
}

function mapGoal(goal: {
  id: string
  name: string
  balance: { toString(): string }
  target: { toString(): string } | null
  currency: string
}): SavingsGoalDto {
  const balance = Number(goal.balance)
  const target = goal.target != null ? Number(goal.target) : null
  return {
    id: goal.id,
    name: goal.name,
    balance,
    target,
    currency: goal.currency,
    progress: target ? Math.min(100, Math.round((balance / target) * 1000) / 10) : null
  }
}

export async function listSavingsGoalsForSpace(ctx: SpaceContext): Promise<SavingsGoalDto[]> {
  const goals = await prisma.savingsGoal.findMany({
    where: { spaceId: ctx.spaceId, userId: ctx.userId },
    orderBy: { createdAt: 'asc' }
  })
  return goals.map(mapGoal)
}

export async function createSavingsGoalForSpace(
  ctx: SpaceContext,
  input: { name: string, target?: number | null, currency?: string }
): Promise<SavingsGoalDto> {
  const goal = await prisma.savingsGoal.create({
    data: {
      userId: ctx.userId,
      spaceId: ctx.spaceId,
      name: input.name.trim(),
      target: input.target ?? null,
      currency: input.currency ?? 'USD'
    }
  })
  return mapGoal(goal)
}

export async function contributeToSavingsGoal(
  ctx: SpaceContext,
  goalId: string,
  amount: number
): Promise<SavingsGoalDto> {
  const goal = await prisma.savingsGoal.findFirst({
    where: { id: goalId, spaceId: ctx.spaceId, userId: ctx.userId }
  })
  if (!goal) throw createError({ statusCode: 404, message: 'Goal not found' })
  if (amount <= 0) throw createError({ statusCode: 400, message: 'Amount must be positive' })

  const updated = await prisma.savingsGoal.update({
    where: { id: goal.id },
    data: { balance: { increment: amount } }
  })
  return mapGoal(updated)
}
