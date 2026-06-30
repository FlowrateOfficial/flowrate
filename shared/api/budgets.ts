// ANCHOR: Budget list API contract

export interface BudgetListItem {
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
