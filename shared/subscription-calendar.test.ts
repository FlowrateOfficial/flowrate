import { describe, expect, it } from 'vitest'
import { buildRenewalCalendarEvents, RENEWAL_CALENDAR_HORIZON_DAYS } from './subscription-calendar'
import { ENUM } from './prisma-enums'

describe('buildRenewalCalendarEvents', () => {
  it('generates events through the default horizon', () => {
    const next = new Date()
    next.setDate(15)
    next.setHours(12, 0, 0, 0)

    const events = buildRenewalCalendarEvents([{
      id: 'sub-1',
      name: 'Netflix',
      amount: 15.99,
      currency: 'USD',
      frequency: ENUM.period.MONTHLY,
      nextCharge: next,
      status: ENUM.subscription.ACTIVE
    }])

    expect(events.length).toBeGreaterThan(10)
    const last = events.at(-1)!
    const first = new Date(events[0]!.date)
    const lastDate = new Date(last.date)
    const spanDays = (lastDate.getTime() - first.getTime()) / 86_400_000
    expect(spanDays).toBeGreaterThan(RENEWAL_CALENDAR_HORIZON_DAYS - 40)
  })

  it('skips cancelled subscriptions', () => {
    const events = buildRenewalCalendarEvents([{
      id: 'sub-1',
      name: 'Old SaaS',
      amount: 9,
      currency: 'USD',
      frequency: ENUM.period.MONTHLY,
      nextCharge: new Date(),
      status: ENUM.subscription.CANCELLED
    }])
    expect(events).toHaveLength(0)
  })
})
