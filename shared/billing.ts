// ANCHOR: App plan tiers and Stripe billing status mapping
export const APP_PLANS = ['FREE', 'PRO', 'ENTERPRISE'] as const
export type AppPlan = (typeof APP_PLANS)[number]

export const PAID_BILLING_STATUSES = new Set([
  'TRIALING',
  'ACTIVE',
  'PAST_DUE'
] as const)

export type SubStatus =
  | 'INCOMPLETE'
  | 'INCOMPLETE_EXPIRED'
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'UNPAID'
  | 'PAUSED'

const STRIPE_STATUS_MAP: Record<string, SubStatus> = {
  incomplete: 'INCOMPLETE',
  incomplete_expired: 'INCOMPLETE_EXPIRED',
  trialing: 'TRIALING',
  active: 'ACTIVE',
  past_due: 'PAST_DUE',
  canceled: 'CANCELED',
  unpaid: 'UNPAID',
  paused: 'PAUSED'
}

export function billingStatusFromStripe(status: string): SubStatus {
  return STRIPE_STATUS_MAP[status] ?? 'CANCELED'
}

export function appPlanFromStripeSubscription(
  status: SubStatus,
  planKey?: string | null
): AppPlan {
  if (!(PAID_BILLING_STATUSES as ReadonlySet<string>).has(status)) return 'FREE'
  const key = (planKey ?? 'pro').trim().toLowerCase()
  if (key === 'enterprise') return 'ENTERPRISE'
  return 'PRO'
}
