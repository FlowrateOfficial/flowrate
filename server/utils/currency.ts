import type { H3Event } from 'h3'
import { currencyForLocale, type DisplayCurrency } from '#shared/currency'

export function localeFromRequest(event: H3Event): string {
  const cookie = getCookie(event, 'user-locale')
  if (cookie) return cookie

  const accept = getHeader(event, 'accept-language') ?? ''
  if (accept.toLowerCase().includes('fr')) return 'fr'
  if (accept.toLowerCase().includes('en-gb')) return 'en-GB'
  return 'en'
}

export function billingCurrencyFromRequest(event: H3Event): string {
  return currencyForLocale(localeFromRequest(event))
}

export function displayCurrencyForLocale(localeHint = 'en'): DisplayCurrency {
  return currencyForLocale(localeHint)
}

export async function resolveSpaceDisplayCurrency(
  _spaceId: string,
  localeHint = 'en'
): Promise<string> {
  return displayCurrencyForLocale(localeHint)
}
