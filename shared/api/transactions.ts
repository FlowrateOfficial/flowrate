// ANCHOR: Transaction list API contract

export interface TransactionAccountRef {
  id: string
  name: string
  visibility?: string
}

export interface TransactionListItem {
  id: string
  description: string
  merchant: string | null
  amount: number
  currency: string
  category: string
  date: string
  pending: boolean
  isMine?: boolean
  ownerName?: string | null
  account: TransactionAccountRef | null
}

export interface TransactionListResponse {
  items: TransactionListItem[]
  total: number
  page: number
  pages: number
}
