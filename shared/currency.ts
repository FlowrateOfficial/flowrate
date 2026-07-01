export const DISPLAY_CURRENCIES = ['USD', 'EUR', 'GBP'] as const

export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number]

export interface LocaleCurrencyConfig {
  intl: string
  currency: DisplayCurrency
}

// ANCHOR: App locale code → Intl locale + default display currency
export const LOCALE_CURRENCY: Record<string, LocaleCurrencyConfig> = {
  'en': { intl: 'en-US', currency: 'USD' },
  'en-GB': { intl: 'en-GB', currency: 'GBP' },
  'fr': { intl: 'fr-FR', currency: 'EUR' }
}

const DEFAULT_LOCALE_CONFIG = LOCALE_CURRENCY.en!

export function resolveLocaleConfig(locale: string): LocaleCurrencyConfig {
  const normalized = locale.trim()
  if (LOCALE_CURRENCY[normalized]) return LOCALE_CURRENCY[normalized]!
  if (normalized.startsWith('fr')) return LOCALE_CURRENCY.fr!
  if (normalized === 'en-GB' || normalized.startsWith('en-GB')) return LOCALE_CURRENCY['en-GB']!
  return DEFAULT_LOCALE_CONFIG
}

export function intlLocaleFor(locale: string): string {
  return resolveLocaleConfig(locale).intl
}

export function currencyForLocale(locale: string): DisplayCurrency {
  return resolveLocaleConfig(locale).currency
}

export function isDisplayCurrency(value: string): value is DisplayCurrency {
  return (DISPLAY_CURRENCIES as readonly string[]).includes(value)
}

export function pickDominantCurrency(
  items: Array<{ currency?: string | null }>
): DisplayCurrency | null {
  const counts = new Map<string, number>()
  for (const item of items) {
    const code = item.currency?.trim().toUpperCase()
    if (!code || !isDisplayCurrency(code)) continue
    counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  if (!counts.size) return null

  const [code] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]!
  return code as DisplayCurrency
}

export function resolveDisplayCurrency(
  locale: string,
  items: Array<{ currency?: string | null }> = []
): DisplayCurrency {
  return pickDominantCurrency(items) ?? currencyForLocale(locale)
}

export function formatMoney(
  amount: number,
  locale: string,
  currency?: string
): string {
  const config = resolveLocaleConfig(locale)
  const code = currency && isDisplayCurrency(currency.toUpperCase())
    ? currency.toUpperCase()
    : config.currency

  return new Intl.NumberFormat(config.intl, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatCompactMoney(
  amount: number,
  locale: string,
  currency?: string
): string {
  const config = resolveLocaleConfig(locale)
  const code = currency && isDisplayCurrency(currency.toUpperCase())
    ? currency.toUpperCase()
    : config.currency

  return new Intl.NumberFormat(config.intl, {
    style: 'currency',
    currency: code,
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(amount)
}
