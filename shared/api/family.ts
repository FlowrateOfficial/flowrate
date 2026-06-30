// ANCHOR: Family / household space API contracts
import type { TransactionListItem } from './transactions'

export interface ChildProfileDto {
  id: string
  allowance: number | null
  frequency: string | null
  learnMode: boolean
  jars: Array<{ id: string, name: string, balance: number, target: number | null }>
}

export interface SpaceDetailMemberDto {
  id: string
  userId: string | null
  email: string | null
  name: string | null
  role: string
  status: string
  birthday: string | null
  childProfile: ChildProfileDto | null
  financialSummary: { balance: number, spending30d: number, accountCount: number } | null
}

export interface SpaceDetailDto {
  id: string
  name: string
  type: string
  role: string
  settings: unknown
  members: SpaceDetailMemberDto[]
  accounts: unknown[]
}

export interface MemberFinancialDto {
  member: {
    id: string
    userId?: string | null
    name: string | null
    email: string | null
    role: string
    status: string
    birthday: string | null
    hasAccount: boolean
    childProfile?: ChildProfileDto | null
  }
  accounts: Array<{
    id: string
    name: string
    institution: string | null
    type: string
    visibility: string
    balance: number
    currency: string
    syncedAt: string | null
  }>
  transactions: TransactionListItem[]
  stats: {
    balance: number
    spending30d: number
    income30d: number
    transactionCount: number
    currency: string
  }
}
