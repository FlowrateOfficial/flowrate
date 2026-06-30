// ANCHOR: Subscription list API contract

export interface SubscriptionListItemDto {
  id: string
  name: string
  rawName: string
  amount: number
  prev: number | null
  priceChangePercent: number | null
  periodPriceImpact: number | null
  annualPriceImpact: number | null
  currency: string
  frequency: string | null
  status: string
  icon: string | null
  lastCharge: string | null
  nextCharge: string | null
  alert: boolean
  hidden: boolean
  excluded: boolean
  isDuplicate: boolean
  duplicateCount: number
  duplicateIds: string[]
}

export interface SubscriptionCapStatusDto {
  cap: number
  monthlyTotal: number
  currency: string
  exceeded: boolean
}

export interface RenewalCalendarResponse {
  events: Array<{
    date: string
    subscriptionId: string
    name: string
    amount: number
    currency: string
    monthlyEquivalent: number
  }>
  currency: string
}
