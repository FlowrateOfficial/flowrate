// NOTE - ANCHOR: Post-checkout billing sync — webhooks may lag in local dev
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.query.upgraded !== '1') return

  const userStore = useUserStore()
  const sessionId = typeof to.query.session_id === 'string' ? to.query.session_id : undefined

  await userStore.fetchProfile({
    syncBilling: true,
    checkoutSessionId: sessionId
  })
})
