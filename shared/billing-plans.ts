export interface StripePlanMatch {
  key: string
  interval: 'day' | 'week' | 'month' | 'year' | null
  currency: string
}

export function matchStripePlan<T extends StripePlanMatch>(
  plans: T[],
  options: {
    planKey: string
    interval?: 'month' | 'year'
    currency?: string
  }
): T | undefined {
  const key = options.planKey.trim().toLowerCase()
  const interval = options.interval ?? 'month'
  const currency = options.currency?.trim().toUpperCase()

  const byKey = plans.filter(plan => plan.key.toLowerCase() === key)
  if (!byKey.length) return undefined

  const byInterval = byKey.filter(plan => plan.interval === interval)
  const pool = byInterval.length ? byInterval : byKey

  if (currency) {
    return pool.find(plan => plan.currency.toUpperCase() === currency)
      ?? pool.find(plan => plan.currency.toUpperCase() === 'EUR')
      ?? pool[0]
  }

  return pool[0]
}

export function findStripePlanInCurrency<T extends StripePlanMatch>(
  plans: T[],
  options: {
    planKey: string
    interval?: 'month' | 'year'
    currency: string
  }
): T | undefined {
  const key = options.planKey.trim().toLowerCase()
  const interval = options.interval ?? 'month'
  const currency = options.currency.trim().toUpperCase()

  return plans.find(plan =>
    plan.key.toLowerCase() === key
    && plan.interval === interval
    && plan.currency.toUpperCase() === currency
  )
}
