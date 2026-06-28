import { formatPlanPrice, listStripePlans } from '../../lib/billing'
import { requireStripe } from '../../lib/stripe'

// ANCHOR: Public Stripe plan catalog (cached 5 min)
export default defineEventHandler(async (event) => {
  const { stripe } = requireStripe(event)
  const plans = await listStripePlans(stripe)
  const locale = getHeader(event, 'accept-language')?.split(',')[0] ?? 'en-US'

  return {
    plans: plans.map(plan => ({
      ...plan,
      formattedPrice: formatPlanPrice(plan, locale),
      formattedPeriod: plan.interval === 'month' ? '/mo' : plan.interval ? `/${plan.interval}` : undefined
    }))
  }
})
