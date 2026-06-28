import { apiRoutes, useApi } from '~/lib/api'

/** After Stripe Checkout success, sync plan from Stripe (webhooks may lag in local dev). */
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.query.upgraded !== '1') return

  const userStore = useUserStore()
  const sessionId = typeof to.query.session_id === 'string' ? to.query.session_id : undefined

  try {
    const { api } = useApi()
    const result = await api<{ plan: 'FREE' | 'PRO' | 'ENTERPRISE' }>(apiRoutes.stripe.syncSubscription, {
      method: 'POST',
      body: sessionId ? { sessionId } : {},
      noSpace: true
    })
    userStore.plan = result.plan
  } catch {
    await userStore.fetchUser()
    return
  }

  await userStore.fetchUser()
})
