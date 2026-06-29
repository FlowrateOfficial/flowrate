// ANCHOR: Sync active plan from user profile store
export default defineNuxtPlugin(() => {
  const userStore = useUserStore()
  const activePlan = useActivePlan()

  watch(
    () => userStore.plan,
    (plan) => {
      activePlan.value = plan
    },
    { immediate: true }
  )
})
