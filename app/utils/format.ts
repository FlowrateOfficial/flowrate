export function formatCurrency(
  amount: number,
  locale = 'en-US',
  currency = 'USD'
): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
}

export function localeToIntl(locale: string): string {
  return locale === 'fr' ? 'fr-FR' : 'en-US'
}

export function formatCurrencyForLocale(
  amount: number,
  locale: string,
  currency = 'USD'
): string {
  return formatCurrency(amount, localeToIntl(locale), currency)
}
