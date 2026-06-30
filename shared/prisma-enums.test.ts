import { describe, expect, it } from 'vitest'
import { ENUM, SubscriptionStatus, BudgetPeriod } from './prisma-enums'

describe('prisma-enums', () => {
  it('groups subscription status for dot access', () => {
    expect(ENUM.subscription.PRICE_CHANGED).toBe('PRICE_CHANGED')
    expect(SubscriptionStatus.PRICE_CHANGED).toBe(ENUM.subscription.PRICE_CHANGED)
  })

  it('groups budget period for dot access', () => {
    expect(ENUM.period.MONTHLY).toBe('MONTHLY')
    expect(BudgetPeriod.WEEKLY).toBe(ENUM.period.WEEKLY)
  })
})
