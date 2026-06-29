import type { FeedbackLabel } from '~/types/feedback'

export function feedbackLabelTextColor(hex: string | undefined): string {
  const normalized = (hex ?? '6b7280').replace('#', '')
  if (normalized.length !== 6) return '#ffffff'

  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.62 ? '#111827' : '#ffffff'
}

export function feedbackLabelStyle(label: FeedbackLabel): Record<string, string> {
  const color = (label.color ?? '6b7280').replace('#', '')
  return {
    backgroundColor: `#${color}`,
    color: feedbackLabelTextColor(color),
    borderColor: `#${color}`
  }
}
