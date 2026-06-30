import type { BudgetListItem } from '#shared/api/budgets'

export type BudgetItem = BudgetListItem

export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface BudgetFormInput {
  name: string
  category: string
  amount: string
  period: BudgetPeriod
  isShared: boolean
}
