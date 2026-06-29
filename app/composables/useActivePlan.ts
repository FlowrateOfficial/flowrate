import type { AppPlan } from '#shared/billing'

/** SSR-safe plan mirror — synced from user profile; use instead of a module-level ref. */
export function useActivePlan() {
  return useState<AppPlan>('flowrate-active-plan', () => 'FREE')
}
