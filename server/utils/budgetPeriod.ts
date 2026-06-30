import type { BudgetPeriod } from '#shared/prisma-enums'
import { ENUM } from '#shared/prisma-enums'

export function periodStart(period: BudgetPeriod, now = new Date()): Date {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)

  if (period === ENUM.period.WEEKLY) {
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    return d
  }

  if (period === ENUM.period.YEARLY) {
    return new Date(d.getFullYear(), 0, 1)
  }

  return new Date(d.getFullYear(), d.getMonth(), 1)
}
