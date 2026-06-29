// NOTE - ANCHOR: Locale-aware money formatting — delegates to shared/currency
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

export { formatCompactMoney, formatMoney } from '#shared/currency'
