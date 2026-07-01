import { ENUM, type BudgetPeriod, type TransactionCategory } from '#shared/prisma-enums'

interface TxLike {
  merchant: string | null
  description: string
  amount: number
  date: Date
  category: TransactionCategory
}

export interface DetectedSubCandidate {
  name: string
  amount: number
  frequency: BudgetPeriod
  category: TransactionCategory
  lastCharge: Date
  nextCharge: Date
}

function merchantKey(tx: TxLike): string {
  return (tx.merchant ?? tx.description).toLowerCase().trim()
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + weeks * 7)
  return d
}

export function detectSubscriptionsFromTransactions(txs: TxLike[]): DetectedSubCandidate[] {
  const debits = txs.filter(tx => tx.amount < 0)
  const groups = new Map<string, TxLike[]>()

  for (const tx of debits) {
    const key = merchantKey(tx)
    if (!key) continue
    const list = groups.get(key) ?? []
    list.push(tx)
    groups.set(key, list)
  }

  const results: DetectedSubCandidate[] = []

  for (const [, charges] of groups) {
    if (charges.length < 2) continue

    const sorted = [...charges].sort((a, b) => b.date.getTime() - a.date.getTime())
    const amounts = sorted.map(c => Math.abs(c.amount))
    const avg = amounts.reduce((s, v) => s + v, 0) / amounts.length
    const variance = amounts.every(a => Math.abs(a - avg) / avg < 0.15)
    if (!variance) continue

    const gaps: number[] = []
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]
      if (!current || !next) continue
      gaps.push((current.date.getTime() - next.date.getTime()) / 86_400_000)
    }
    if (!gaps.length) continue
    const avgGap = gaps.reduce((s, v) => s + v, 0) / gaps.length

    let frequency: BudgetPeriod
    if (avgGap >= 25 && avgGap <= 35) frequency = ENUM.period.MONTHLY
    else if (avgGap >= 6 && avgGap <= 8) frequency = ENUM.period.WEEKLY
    else if (avgGap >= 350 && avgGap <= 380) frequency = ENUM.period.YEARLY
    else continue

    const last = sorted[0]
    if (!last) continue
    const nextCharge = frequency === ENUM.period.WEEKLY
      ? addWeeks(last.date, 1)
      : frequency === ENUM.period.YEARLY
        ? addMonths(last.date, 12)
        : addMonths(last.date, 1)

    results.push({
      name: last.merchant ?? last.description,
      amount: Math.round(avg * 100) / 100,
      frequency,
      category: last.category === ENUM.category.OTHER
        ? ENUM.category.SUBSCRIPTIONS
        : last.category,
      lastCharge: last.date,
      nextCharge
    })
  }

  return results.sort((a, b) => b.amount - a.amount)
}
