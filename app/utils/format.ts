// ANCHOR: Locale-aware date and currency formatters
import {
  formatMoney,
  intlLocaleFor,
  type DisplayCurrency
} from '#shared/currency'

export type { DisplayCurrency }

export function localeToIntl(locale: string): string {
  return intlLocaleFor(locale)
}

export function formatCurrency(
  amount: number,
  locale = 'en',
  currency?: string
): string {
  return formatMoney(amount, locale, currency)
}

export function formatCurrencyForLocale(
  amount: number,
  locale: string,
  currency?: string
): string {
  return formatMoney(amount, locale, currency)
}

export function formatMediumDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocaleFor(locale), { dateStyle: 'medium' }).format(new Date(iso))
}

export function formatShortDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocaleFor(locale), { month: 'short', day: 'numeric' }).format(new Date(iso))
}

export function formatShortDateWithYear(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocaleFor(locale), {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(iso))
}

export function formatOptionalDate(
  iso: string | null | undefined,
  locale: string,
  style: 'short' | 'medium' = 'medium'
): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return style === 'short' ? formatShortDate(iso, locale) : formatMediumDate(iso, locale)
}

export function formatDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocaleFor(locale), {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso))
}

export function formatAbsAmount(
  amount: number,
  locale: string,
  currency: string
): string {
  return formatMoney(Math.abs(amount), locale, currency)
}

export { formatCompactMoney, formatMoney } from '#shared/currency'
