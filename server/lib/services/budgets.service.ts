// ANCHOR: Budget create/update service
import type { BudgetListItem } from '#shared/api/budgets'
import type { z } from 'zod'
import type { budgetBodySchema } from '../schemas/api'
import type { SpaceContext } from '../domain/context'
import { periodStart } from '../../utils/budgetPeriod'
import { canEditFinancials } from '../../utils/spaceAuth'
import { listVisibleAccountIdsForContext, spentByCategorySince } from '../repositories/transaction.repository'
import {
  createBudget,
  deleteBudget,
  findBudgetInSpace,
  listBudgetsForUser,
  mapBudgetDto,
  updateBudget,
  type BudgetPeriod
} from '../repositories/budget.repository'

type BudgetBody = z.infer<typeof budgetBodySchema>

function assertCanEditBudgets(ctx: SpaceContext) {
  if (!canEditFinancials(ctx.role, ctx.spaceType)) {
    throw createError({ statusCode: 403, message: 'You have read-only access to this business space' })
  }
}

async function spentForBudget(
  ctx: SpaceContext,
  category: string,
  period: BudgetPeriod,
  now = new Date()
) {
  const visibleAccountIds = await listVisibleAccountIdsForContext(ctx)
  const from = periodStart(period, now)
  const spentMap = await spentByCategorySince(ctx.spaceId, visibleAccountIds, from)
  return spentMap.get(category) ?? 0
}

export async function createBudgetForSpace(
  ctx: SpaceContext,
  body: BudgetBody,
  currency: string
): Promise<BudgetListItem> {
  assertCanEditBudgets(ctx)
  const now = new Date()
  const from = periodStart(body.period, now)
  const spent = await spentForBudget(ctx, body.category, body.period, now)

  const budget = await createBudget({
    userId: ctx.userId,
    spaceId: ctx.spaceId,
    name: body.name,
    category: body.category,
    amount: body.amount,
    period: body.period,
    isShared: body.isShared,
    startDate: from
  })

  return mapBudgetDto(budget, currency, spent, ctx.userId)
}

export async function updateBudgetForSpace(
  ctx: SpaceContext,
  budgetId: string,
  body: BudgetBody,
  currency: string
): Promise<BudgetListItem> {
  assertCanEditBudgets(ctx)

  const existing = await findBudgetInSpace(budgetId, ctx.spaceId)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Budget not found' })
  }

  if (existing.userId !== ctx.userId && !existing.isShared) {
    throw createError({ statusCode: 403, message: 'Cannot edit this budget' })
  }

  const now = new Date()
  const spent = await spentForBudget(ctx, body.category, body.period, now)

  const budget = await updateBudget(budgetId, {
    name: body.name,
    category: body.category,
    amount: body.amount,
    period: body.period,
    isShared: body.isShared
  })

  return mapBudgetDto(budget, currency, spent, ctx.userId)
}

export async function listBudgetsForSpace(
  ctx: SpaceContext,
  currency: string
): Promise<BudgetListItem[]> {
  const now = new Date()
  const visibleAccountIds = await listVisibleAccountIdsForContext(ctx)
  const budgets = await listBudgetsForUser(ctx)

  if (!budgets.length || !visibleAccountIds.length) {
    return budgets.map(budget => mapBudgetDto(budget, currency, 0, ctx.userId))
  }

  const periodStarts = new Map<string, Date>()
  for (const budget of budgets) {
    const from = periodStart(budget.period, now)
    periodStarts.set(from.toISOString(), from)
  }

  const spentByPeriod = new Map<string, Map<string, number>>()
  await Promise.all([...periodStarts.entries()].map(async ([key, from]) => {
    const spent = await spentByCategorySince(ctx.spaceId, visibleAccountIds, from)
    spentByPeriod.set(key, spent)
  }))

  return budgets.map((budget) => {
    const fromKey = periodStart(budget.period as BudgetPeriod, now).toISOString()
    const spent = spentByPeriod.get(fromKey)?.get(budget.category) ?? 0
    return mapBudgetDto(budget, currency, spent, ctx.userId)
  })
}

export async function deleteBudgetForSpace(ctx: SpaceContext, budgetId: string) {
  const budget = await findBudgetInSpace(budgetId, ctx.spaceId)

  if (!budget) {
    throw createError({ statusCode: 404, message: 'Budget not found' })
  }

  if (budget.userId !== ctx.userId && !budget.isShared) {
    throw createError({ statusCode: 403, message: 'Cannot delete this budget' })
  }

  await deleteBudget(budgetId)
  return { ok: true }
}
