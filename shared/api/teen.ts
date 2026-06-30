// ANCHOR: Teen dashboard API contract
export interface TeenJarDto {
  id: string
  name: string
  balance: number
  target: number | null
  progress: number | null
}

export interface TeenDashboardDto {
  name: string | null
  role: string
  learnMode: boolean
  allowance: number | null
  frequency: string | null
  limits: unknown
  jars: TeenJarDto[]
  totalSaved: number
  nudges: TeenSpendingNudgeDto[]
}

export interface TeenSpendingNudgeDto {
  category: string
  spent: number
  limit: number
  percent: number
}
