import type { TransactionCategory } from '@prisma/client'

export type AnalyticsRange = '7d' | '30d' | '90d' | '12m'

export function rangeToDates(range: AnalyticsRange): { from: Date, to: Date } {
  const to = new Date()
  const from = new Date()

  switch (range) {
    case '7d':
      from.setDate(from.getDate() - 7)
      break
    case '30d':
      from.setDate(from.getDate() - 30)
      break
    case '90d':
      from.setDate(from.getDate() - 90)
      break
    case '12m':
      from.setMonth(from.getMonth() - 12)
      break
  }

  from.setHours(0, 0, 0, 0)
  return { from, to }
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function buildCashFlowSeries(
  txs: Array<{ date: Date, amount: number }>,
  from: Date,
  to: Date,
  bucket: 'day' | 'month'
) {
  const buckets = new Map<string, { income: number, spending: number }>()

  const cursor = new Date(from)
  while (cursor <= to) {
    const key = bucket === 'month' ? monthKey(cursor) : dayKey(cursor)
    if (!buckets.has(key)) buckets.set(key, { income: 0, spending: 0 })
    if (bucket === 'month') cursor.setMonth(cursor.getMonth() + 1)
    else cursor.setDate(cursor.getDate() + 1)
  }

  for (const tx of txs) {
    const key = bucket === 'month' ? monthKey(tx.date) : dayKey(tx.date)
    const entry = buckets.get(key)
    if (!entry) continue
    if (tx.amount > 0) entry.income += tx.amount
    else entry.spending += Math.abs(tx.amount)
  }

  return [...buckets.entries()].map(([period, values]) => ({
    period,
    income: Math.round(values.income * 100) / 100,
    spending: Math.round(values.spending * 100) / 100,
    net: Math.round((values.income - values.spending) * 100) / 100
  }))
}

export function spendingByCategory(
  txs: Array<{ amount: number, category: TransactionCategory }>
) {
  const totals = new Map<TransactionCategory, number>()

  for (const tx of txs) {
    if (tx.amount >= 0) continue
    const cat = tx.category
    totals.set(cat, (totals.get(cat) ?? 0) + Math.abs(tx.amount))
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function netWorthHistory(
  accounts: Array<{ balance: number, createdAt: Date }>,
  txs: Array<{ date: Date, amount: number }>,
  from: Date,
  to: Date
) {
  const currentBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const sorted = [...txs].sort((a, b) => b.date.getTime() - a.date.getTime())

  let balance = currentBalance
  const points: Array<{ period: string, balance: number }> = []
  const cursor = new Date(to)

  while (cursor >= from) {
    const key = monthKey(cursor)
    points.unshift({ period: key, balance: Math.round(balance * 100) / 100 })

    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59)

    for (const tx of sorted) {
      if (tx.date >= monthStart && tx.date <= monthEnd) {
        balance -= tx.amount
      }
    }

    cursor.setMonth(cursor.getMonth() - 1)
  }

  return points
}
