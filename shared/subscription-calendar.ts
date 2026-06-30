// ANCHOR: Renewal calendar helpers
import type { BudgetPeriod } from './prisma-enums'
import { ENUM } from './prisma-enums'
import { subscriptionMonthlyEquivalent } from './subscription-alerts'

export interface RenewalCalendarInput {
  id: string
  name: string
  displayName?: string | null
  amount: number
  currency: string
  frequency: BudgetPeriod | string
  nextCharge: Date | string | null
  status: string
}

export interface RenewalCalendarEvent {
  date: string
  subscriptionId: string
  name: string
  amount: number
  currency: string
  monthlyEquivalent: number
}

function addPeriod(date: Date, frequency: string): Date {
  const d = new Date(date)
  if (frequency === ENUM.period.WEEKLY) {
    d.setDate(d.getDate() + 7)
    return d
  }
  if (frequency === ENUM.period.YEARLY) {
    d.setFullYear(d.getFullYear() + 1)
    return d
  }
  d.setMonth(d.getMonth() + 1)
  return d
}

function isoDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** How far ahead renewal dots are generated (default 12 months) */
export const RENEWAL_CALENDAR_HORIZON_DAYS = 365

export function buildRenewalCalendarEvents(
  subs: RenewalCalendarInput[],
  horizonDays = RENEWAL_CALENDAR_HORIZON_DAYS
): RenewalCalendarEvent[] {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + horizonDays)
  const events: RenewalCalendarEvent[] = []

  for (const sub of subs) {
    if (!sub.nextCharge || sub.status === ENUM.subscription.CANCELLED) continue
    const label = sub.displayName?.trim() || sub.name
    let cursor = new Date(sub.nextCharge)
    cursor.setHours(0, 0, 0, 0)
    const monthlyEquivalent = subscriptionMonthlyEquivalent(sub.amount, sub.frequency)

    while (cursor <= end) {
      events.push({
        date: isoDay(cursor),
        subscriptionId: sub.id,
        name: label,
        amount: sub.amount,
        currency: sub.currency,
        monthlyEquivalent
      })
      cursor = addPeriod(cursor, sub.frequency)
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name))
}

export function groupEventsByDate(events: RenewalCalendarEvent[]) {
  const map = new Map<string, RenewalCalendarEvent[]>()
  for (const event of events) {
    const list = map.get(event.date) ?? []
    list.push(event)
    map.set(event.date, list)
  }
  return map
}
