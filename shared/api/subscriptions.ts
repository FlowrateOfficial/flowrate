// ANCHOR: Subscription list API contract

export interface SubscriptionListItemDto {
  id: string
  name: string
  amount: number
  currency: string
  frequency: string | null
  status: string
  icon: string | null
  lastCharge: string | null
  nextCharge: string | null
  alert: boolean
  isDuplicate: boolean
}
