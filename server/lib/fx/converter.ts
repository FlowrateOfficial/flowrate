import { normalizeFxCurrency, roundMoney, convertWithRates, type FxCurrency } from '#shared/fx'
import { getFxRates, type FxRateSnapshot } from './rates'

export interface MoneyAmount {
  amount: number
  currency: string
}

export class FxConverter {
  constructor(
    private readonly snapshot: FxRateSnapshot,
    readonly targetCurrency: FxCurrency
  ) {}

  convert(amount: number, fromCurrency: string): number {
    return convertWithRates(amount, fromCurrency, this.targetCurrency, this.snapshot)
  }

  sum(items: MoneyAmount[]): number {
    return roundMoney(items.reduce((total, item) => total + this.convert(item.amount, item.currency), 0))
  }

  sumByCurrency(totals: Iterable<[string, number]>): number {
    return roundMoney([...totals].reduce(
      (total, [currency, amount]) => total + this.convert(amount, currency),
      0
    ))
  }
}

export async function createFxConverter(targetCurrency: string): Promise<FxConverter> {
  const currency = normalizeFxCurrency(targetCurrency)
  const snapshot = await getFxRates(currency)
  return new FxConverter(snapshot, currency)
}
