// ANCHOR: Chart label/value arrays from analytics overview payloads
import type { AnalyticsOverview } from '~/types/financial'

export function cashFlowSeries(overview: AnalyticsOverview | null | undefined) {
  const points = overview?.cashFlow ?? []
  return {
    labels: points.map(p => p.period),
    income: points.map(p => p.income),
    spending: points.map(p => p.spending)
  }
}

export function categorySeries(
  overview: AnalyticsOverview | null | undefined,
  categoryLabel: (category: string) => string,
  limit?: number
) {
  const rows = overview?.categories ?? []
  const slice = limit != null ? rows.slice(0, limit) : rows
  return {
    labels: slice.map(row => categoryLabel(row.category)),
    values: slice.map(row => row.amount)
  }
}

export function merchantSeries(overview: AnalyticsOverview | null | undefined) {
  const rows = overview?.topMerchants ?? []
  return {
    // NOTE - Truncate long merchant names for chart axis
    labels: rows.map(row => row.name.slice(0, 24)),
    values: rows.map(row => row.amount)
  }
}

export function netWorthSeries(overview: AnalyticsOverview | null | undefined) {
  const points = overview?.netWorth ?? []
  return {
    labels: points.map(p => p.period),
    values: points.map(p => p.balance)
  }
}
