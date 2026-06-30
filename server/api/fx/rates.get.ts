import { getFxRates } from '../../lib/fx/rates'
import { displayCurrencyForLocale, localeFromRequest } from '../../utils/currency'
import { normalizeFxCurrency } from '#shared/fx'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const base = typeof query.base === 'string' && query.base.trim()
    ? normalizeFxCurrency(query.base)
    : displayCurrencyForLocale(localeFromRequest(event))

  const rates = await getFxRates(base)
  return {
    base: rates.base,
    rates: rates.rates,
    presentmentRates: rates.presentmentRates,
    source: rates.source,
    fetchedAt: rates.fetchedAt,
    lockExpiresAt: rates.lockExpiresAt
  }
})
