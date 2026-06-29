export interface BudgetItem {
  id: string
  name: string
  category: string
  amount: number
  currency: string
  spent: number
  period: string
  isShared: boolean
  isMine: boolean
}

export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface BudgetFormInput {
  name: string
  category: string
  amount: string
  period: BudgetPeriod
  isShared: boolean
}
