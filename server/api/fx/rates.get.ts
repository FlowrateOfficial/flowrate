import { getFxRates } from '../../lib/fx/rates'

export default defineEventHandler(async () => {
  const rates = await getFxRates()
  return {
    base: rates.base,
    rates: rates.rates,
    fetchedAt: rates.fetchedAt
  }
})
