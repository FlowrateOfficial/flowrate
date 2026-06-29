import type { AppPlan } from '#shared/billing'
import { limitsForPlan, planHasFeature, type PlanFeature } from '#shared/plan-limits'
import { activePlan } from '~/state/plan'

export function usePlanFeatures() {
  const userStore = useUserStore()
  const plan = computed(() => userStore.plan ?? activePlan.value)

  function has(feature: PlanFeature): boolean {
    return planHasFeature(plan.value, feature)
  }

  function limits() {
    return limitsForPlan(plan.value)
  }

  return {
    plan: plan as ComputedRef<AppPlan>,
    has,
    limits
  }
}
