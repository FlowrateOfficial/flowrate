import { formatPlanPeriod, formatPlanPrice, listStripePlans, buildStripePlanCatalog } from '../../lib/billing'
import { requireStripe } from '../../lib/stripe'
import { billingCurrencyFromRequest, localeFromRequest } from '../../utils/currency'
import { currencyForLocale, intlLocaleFor } from '#shared/currency'

// ANCHOR: Public Stripe plan catalog (cached 5 min) with locale currency display
export default defineEventHandler(async (event) => {
  const { stripe } = requireStripe(event)
  const plans = await listStripePlans(stripe)
  const queryLocale = getQuery(event).locale
  const locale = typeof queryLocale === 'string' && queryLocale.trim()
    ? queryLocale.trim()
    : localeFromRequest(event)
  const preferredCurrency = currencyForLocale(locale)
  const intl = intlLocaleFor(locale)
  const catalog = await buildStripePlanCatalog(plans, { currency: preferredCurrency, locale })

  return {
    preferredCurrency,
    catalog,
    plans: plans.map(plan => ({
      ...plan,
      formattedPrice: formatPlanPrice(plan, intl),
      formattedPeriod: formatPlanPeriod(plan)
    }))
  }
})
