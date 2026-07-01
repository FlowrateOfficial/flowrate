// ANCHOR: App plan tiers and Stripe billing status mapping
import { ENUM, Plan, enumValues, type Plan as PrismaPlan, type SubStatus } from './prisma-enums'

export const APP_PLANS = enumValues(Plan)
export type AppPlan = PrismaPlan

export const PAID_BILLING_STATUSES = new Set([
  ENUM.billing.TRIALING,
  ENUM.billing.ACTIVE,
  ENUM.billing.PAST_DUE
] as const)

export type { SubStatus }

const STRIPE_STATUS_MAP: Record<string, SubStatus> = {
  incomplete: ENUM.billing.INCOMPLETE,
  incomplete_expired: ENUM.billing.INCOMPLETE_EXPIRED,
  trialing: ENUM.billing.TRIALING,
  active: ENUM.billing.ACTIVE,
  past_due: ENUM.billing.PAST_DUE,
  canceled: ENUM.billing.CANCELED,
  unpaid: ENUM.billing.UNPAID,
  paused: ENUM.billing.PAUSED
}

export function billingStatusFromStripe(status: string): SubStatus {
  return STRIPE_STATUS_MAP[status] ?? ENUM.billing.CANCELED
}

export function appPlanFromStripeSubscription(
  status: SubStatus,
  planKey?: string | null
): AppPlan {
  if (!(PAID_BILLING_STATUSES as ReadonlySet<string>).has(status)) return ENUM.plan.FREE
  const key = (planKey ?? 'pro').trim().toLowerCase()
  if (key === 'enterprise') return ENUM.plan.ENTERPRISE
  return ENUM.plan.PRO
}
