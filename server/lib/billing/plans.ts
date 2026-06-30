import type Stripe from 'stripe'
import { intlLocaleFor } from '#shared/currency'
import { findStripePlanInCurrency, matchStripePlan } from '#shared/billing-plans'
import { convertWithPresentmentMarkup } from '#shared/fx'
import { getFxRates } from '../fx/rates'

export interface StripePlan {
  key: string
  productId: string
  priceId: string
  name: string
  description: string | null
  amount: number
  currency: string
  interval: 'day' | 'week' | 'month' | 'year' | null
  intervalCount: number
}

let cache: { fetchedAt: number, plans: StripePlan[] } | null = null
const CACHE_MS = 5 * 60 * 1000

function planKeyFromProduct(product: Stripe.Product): string {
  if (product.metadata?.planKey) return product.metadata.planKey.toLowerCase()
  if (product.metadata?.plan) return product.metadata.plan.toLowerCase()
  return product.name.trim().toLowerCase().replace(/\s+/g, '-')
}

function mapPrice(product: Stripe.Product, price: Stripe.Price): StripePlan | null {
  if (!price.active || !price.recurring) return null

  return {
    key: planKeyFromProduct(product),
    productId: product.id,
    priceId: price.id,
    name: product.name,
    description: product.description,
    amount: price.unit_amount != null ? price.unit_amount / 100 : 0,
    currency: price.currency.toUpperCase(),
    interval: price.recurring.interval,
    intervalCount: price.recurring.interval_count ?? 1
  }
}

function expandPriceCurrencies(product: Stripe.Product, price: Stripe.Price): StripePlan[] {
  const base = mapPrice(product, price)
  if (!base) return []

  const plans = [base]
  const options = price.currency_options
  if (!options || typeof options !== 'object') return plans

  for (const [code, option] of Object.entries(options)) {
    if (!option || typeof option !== 'object') continue
    const currency = code.toUpperCase()
    if (currency === base.currency) continue
    const unitAmount = 'unit_amount' in option ? option.unit_amount : null
    if (unitAmount == null) continue

    plans.push({
      ...base,
      amount: unitAmount / 100,
      currency
    })
  }

  return plans
}

export async function listStripePlans(stripe: Stripe, force = false): Promise<StripePlan[]> {
  if (!force && cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache.plans
  }

  const products = await stripe.products.list({
    active: true,
    limit: 25
  })

  const plans: StripePlan[] = []

  for (const product of products.data) {
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 20,
      expand: ['data.currency_options']
    })

    for (const price of prices.data) {
      for (const mapped of expandPriceCurrencies(product, price)) {
        plans.push(mapped)
      }
    }
  }

  plans.sort((a, b) => a.amount - b.amount)

  cache = { fetchedAt: Date.now(), plans }
  return plans
}

export async function resolveStripePriceId(
  stripe: Stripe,
  options: {
    planKey?: string
    priceId?: string
    fallbackPriceId?: string
    interval?: 'month' | 'year'
    currency?: string
  }
): Promise<string> {
  if (options.priceId) return options.priceId

  const key = (options.planKey ?? 'pro').toLowerCase()
  const interval = options.interval ?? 'month'
  const plans = await listStripePlans(stripe)

  const matched = matchStripePlan(plans, { planKey: key, interval, currency: options.currency })
  if (matched) return matched.priceId

  const byName = plans.find(p => p.name.toLowerCase() === key)
  if (byName) return byName.priceId

  if (key === 'pro' && options.fallbackPriceId) return options.fallbackPriceId

  throw createError({
    statusCode: 404,
    message: `No Stripe price found for plan "${key}" (${interval}${options.currency ? `, ${options.currency}` : ''}). Add a Product with metadata planKey=${key}.`
  })
}

export function formatPlanPrice(plan: Pick<StripePlan, 'amount' | 'currency'>, locale = 'en-US'): string {
  if (plan.amount === 0) return 'Free'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: plan.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(plan.amount)
}

export interface ResolvedStripePlan extends StripePlan {
  formattedPrice: string
  formattedPeriod?: string
  billingCurrency: string
  convertedForDisplay: boolean
}

export async function buildStripePlanCatalog(
  plans: StripePlan[],
  options: { currency: string, locale: string }
): Promise<ResolvedStripePlan[]> {
  let rates: Awaited<ReturnType<typeof getFxRates>> | null = null
  try {
    rates = await getFxRates(options.currency)
  } catch {
    rates = null
  }
  const intl = intlLocaleFor(options.locale)
  const planKeys = [...new Set(plans.map(plan => plan.key))]
  const intervals: Array<'month' | 'year'> = ['month', 'year']
  const resolved: ResolvedStripePlan[] = []

  for (const planKey of planKeys) {
    for (const interval of intervals) {
      const native = findStripePlanInCurrency(plans, {
        planKey,
        interval,
        currency: options.currency
      })
      const fallback = matchStripePlan(plans, { planKey, interval })
      const source = native ?? fallback
      if (!source) continue

      const amount = native
        ? source.amount
        : rates
          ? convertWithPresentmentMarkup(
            source.amount,
            source.currency,
            options.currency,
            rates
          )
          : source.amount
      const currency = (native
        ? source.currency
        : rates
          ? options.currency
          : source.currency
      ).toUpperCase()
      const displayPlan = { ...source, amount, currency }

      resolved.push({
        ...displayPlan,
        formattedPrice: formatPlanPrice(displayPlan, intl),
        formattedPeriod: formatPlanPeriod(source),
        billingCurrency: options.currency.toUpperCase(),
        convertedForDisplay: !native && !!rates
      })
    }
  }

  return resolved
}

export function formatPlanPeriod(plan: StripePlan): string | undefined {
  if (!plan.interval) return undefined
  if (plan.interval === 'month') return '/mo'
  if (plan.interval === 'year') return '/yr'
  return `/${plan.interval}`
}
