import type { AppPlan } from '#shared/billing'

/** Active subscription plan — synced from user profile bootstrap. */
export const activePlan = ref<AppPlan>('FREE')
