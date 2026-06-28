import type Stripe from 'stripe'

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

function mapProduct(product: Stripe.Product): StripePlan | null {
  const raw = product.default_price
  if (!raw || typeof raw === 'string') return null

  const price = raw as Stripe.Price
  if (!price.active) return null

  return {
    key: planKeyFromProduct(product),
    productId: product.id,
    priceId: price.id,
    name: product.name,
    description: product.description,
    amount: price.unit_amount != null ? price.unit_amount / 100 : 0,
    currency: price.currency.toUpperCase(),
    interval: price.recurring?.interval ?? null,
    intervalCount: price.recurring?.interval_count ?? 1
  }
}

export async function listStripePlans(stripe: Stripe, force = false): Promise<StripePlan[]> {
  if (!force && cache && Date.now() - cache.fetchedAt < CACHE_MS) {
    return cache.plans
  }

  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price'],
    limit: 25
  })

  const plans = products.data
    .map(mapProduct)
    .filter((p): p is StripePlan => p != null)
    .sort((a, b) => a.amount - b.amount)

  cache = { fetchedAt: Date.now(), plans }
  return plans
}

export async function resolveStripePriceId(
  stripe: Stripe,
  options: { planKey?: string, priceId?: string, fallbackPriceId?: string }
): Promise<string> {
  if (options.priceId) return options.priceId

  const key = (options.planKey ?? 'pro').toLowerCase()
  const plans = await listStripePlans(stripe)

  const byKey = plans.find(p => p.key === key)
  if (byKey) return byKey.priceId

  const byName = plans.find(p => p.name.toLowerCase() === key)
  if (byName) return byName.priceId

  if (key === 'pro' && options.fallbackPriceId) return options.fallbackPriceId

  throw createError({
    statusCode: 404,
    message: `No Stripe price found for plan "${key}". Create a Product in Stripe with metadata planKey=${key}, or set STRIPE_PRICE_PRO.`
  })
}

export function formatPlanPrice(plan: StripePlan, locale = 'en-US'): string {
  if (plan.amount === 0) return 'Free'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: plan.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(plan.amount)
}
