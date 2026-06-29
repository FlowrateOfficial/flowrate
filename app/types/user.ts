import type { AppPlan } from '#shared/billing'

export interface UserBillingInfo {
  customerId: string | null
  subscription: {
    status: string
    periodEnd: string | null
    cancelAtEnd: boolean
    planKey: string | null
    priceId: string
  } | null
}

export interface UserProfile {
  id: string
  name: string | null
  email: string
  phone: string | null
  phoneVerified: boolean
  plan: AppPlan
  isAdmin?: boolean
  billing?: UserBillingInfo | null
  verificationSent?: boolean
  verificationError?: string | null
}
