import type { BudgetListItem } from '#shared/api/budgets'
import type { BudgetPeriod } from '#shared/prisma-enums'

export type BudgetItem = BudgetListItem

export type { BudgetPeriod }

export interface BudgetFormInput {
  name: string
  category: string
  amount: string
  period: BudgetPeriod
  isShared: boolean
}
