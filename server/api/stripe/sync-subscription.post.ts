import { z } from 'zod'
import { requireAuthUser } from '../../lib/auth'
import { syncPlanFromCheckoutSession, syncUserPlanFromStripe } from '../../lib/billing'
import { requireStripe } from '../../lib/stripe'

const bodySchema = z.object({
  sessionId: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const { stripe } = requireStripe(event)
  const body = await readBody(event).catch(() => ({}))
  const { sessionId } = bodySchema.parse(body ?? {})

  const plan = sessionId
    ? await syncPlanFromCheckoutSession(stripe, user.id, sessionId)
    : await syncUserPlanFromStripe(stripe, user.id)

  return { plan }
})
