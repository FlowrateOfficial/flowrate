// ANCHOR: SSR-safe active plan mirrored from user store
import type { AppPlan } from '#shared/billing'

export function useActivePlan() {
  return useState<AppPlan>('flowrate-active-plan', () => 'FREE')
}
