// NOTE - ANCHOR: Typed nuxt-i18n-micro wrapper
import {
  currencyForLocale,
  formatMoney,
  intlLocaleFor,
  resolveDisplayCurrency,
  type DisplayCurrency
} from '#shared/currency'

type TranslateParams = Record<string, string | number>

export function useAppI18n() {
  const { t: rawT, getLocale, switchLocale, getLocales } = useI18n()

  const t = (key: string, params?: TranslateParams): string => {
    const result = rawT(key, params as never)
    return result == null ? key : String(result)
  }

  function spaceType(type: string) {
    return t(`spaceTypes.${type}`)
  }

  function categoryLabel(cat: string): string {
    const key = `categories.${cat}`
    const translated = t(key)
    return translated !== key ? translated : cat
  }

  const intlLocale = computed(() => intlLocaleFor(getLocale()))
  const displayCurrency = computed<DisplayCurrency>(() => currencyForLocale(getLocale()))

  function formatCurrency(amount: number, currency?: string) {
    return formatMoney(amount, getLocale(), currency)
  }

  function resolveCurrency(items: Array<{ currency?: string | null }> = []) {
    return resolveDisplayCurrency(getLocale(), items)
  }

  return {
    t,
    getLocale,
    switchLocale,
    getLocales,
    spaceType,
    categoryLabel,
    intlLocale,
    displayCurrency,
    formatCurrency,
    resolveCurrency
  }
}
