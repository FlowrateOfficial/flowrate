/** Application plan tiers (mirrors Prisma `Plan` enum). */
export const APP_PLANS = ['FREE', 'PRO', 'ENTERPRISE'] as const
export type AppPlan = (typeof APP_PLANS)[number]

/** Stripe subscription statuses that grant paid app access. */
export const PAID_BILLING_STATUSES = new Set([
  'TRIALING',
  'ACTIVE',
  'PAST_DUE'
] as const)

export type BillingSubscriptionStatus =
  | 'INCOMPLETE'
  | 'INCOMPLETE_EXPIRED'
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'UNPAID'
  | 'PAUSED'

const STRIPE_STATUS_MAP: Record<string, BillingSubscriptionStatus> = {
  incomplete: 'INCOMPLETE',
  incomplete_expired: 'INCOMPLETE_EXPIRED',
  trialing: 'TRIALING',
  active: 'ACTIVE',
  past_due: 'PAST_DUE',
  canceled: 'CANCELED',
  unpaid: 'UNPAID',
  paused: 'PAUSED'
}

export function billingStatusFromStripe(status: string): BillingSubscriptionStatus {
  return STRIPE_STATUS_MAP[status] ?? 'CANCELED'
}

export function appPlanFromBillingStatus(status: BillingSubscriptionStatus): AppPlan {
  return (PAID_BILLING_STATUSES as ReadonlySet<string>).has(status) ? 'PRO' : 'FREE'
}
