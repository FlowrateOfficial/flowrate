import { requireAuthUser } from '../../lib/auth'
import { syncPlanFromCheckoutSession, syncUserPlanFromStripe } from '../../lib/billing'
import { requireStripe } from '../../lib/stripe'
import { stripeSyncSubscriptionBodySchema } from '../../lib/schemas/api'

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const { stripe } = requireStripe(event)
  const body = await readValidatedBody(event, stripeSyncSubscriptionBodySchema.parse)

  const plan = body.sessionId
    ? await syncPlanFromCheckoutSession(stripe, user.id, body.sessionId)
    : await syncUserPlanFromStripe(stripe, user.id)

  return { plan }
})
