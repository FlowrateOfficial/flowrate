import type { AppPlan } from '#shared/billing'

export interface UserBillingInfo {
  stripeCustomerId: string | null
  subscription: {
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null
}

export interface UserProfile {
  id: string
  name: string | null
  email: string
  phone: string | null
  phoneVerified: boolean
  plan: AppPlan
  billing?: UserBillingInfo | null
  verificationSent?: boolean
  verificationError?: string | null
}
