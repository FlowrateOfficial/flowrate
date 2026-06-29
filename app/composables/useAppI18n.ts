// ANCHOR: Typed i18n + labels + locale formatters
import {
  currencyForLocale,
  formatMoney,
  intlLocaleFor,
  resolveDisplayCurrency,
  type DisplayCurrency
} from '#shared/currency'
import {
  formatAbsAmount,
  formatDateTime,
  formatOptionalDate,
  formatShortDate,
  formatShortDateWithYear
} from '~/utils/format'

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
    return labelFromKey(`categories.${cat}`, cat)
  }

  function labelFromKey(key: string, fallback?: string): string {
    const translated = t(key)
    return translated !== key ? translated : (fallback ?? key)
  }

  function accountTypeLabel(type: string): string {
    return labelFromKey(
      `accountTypes.${type}`,
      type.charAt(0) + type.slice(1).toLowerCase()
    )
  }

  function roleLabel(role: string): string {
    return labelFromKey(`roles.${role}`, role.toLowerCase().replaceAll('_', ' '))
  }

  function memberStatusLabel(status: string): string {
    return labelFromKey(`memberStatus.${status}`, status.toLowerCase())
  }

  function subscriptionStatusLabel(status: string): string {
    return labelFromKey(`dashboard.subscriptions.status.${status}`, status)
  }

  function subscriptionFrequencyLabel(freq: string | null | undefined): string {
    if (!freq) return '—'
    return labelFromKey(`dashboard.subscriptions.frequency.${freq}`, freq)
  }

  function feedbackTypeLabel(type: string): string {
    return labelFromKey(`dashboard.feedback.types.${type}`, type)
  }

  const intlLocale = computed(() => intlLocaleFor(getLocale()))
  const displayCurrency = computed<DisplayCurrency>(() => currencyForLocale(getLocale()))

  function formatCurrency(amount: number, currency?: string) {
    return formatMoney(amount, getLocale(), currency)
  }

  function resolveCurrency(items: Array<{ currency?: string | null }> = []) {
    return resolveDisplayCurrency(getLocale(), items)
  }

  function formatShortDateValue(iso: string) {
    return formatShortDate(iso, getLocale())
  }

  function formatShortDateWithYearValue(iso: string) {
    return formatShortDateWithYear(iso, getLocale())
  }

  function formatOptionalDateValue(
    iso: string | null | undefined,
    style: 'short' | 'medium' = 'medium'
  ) {
    return formatOptionalDate(iso, getLocale(), style)
  }

  function formatDateTimeValue(iso: string) {
    return formatDateTime(iso, getLocale())
  }

  function formatAbsAmountValue(amount: number, currency: string) {
    return formatAbsAmount(amount, getLocale(), currency)
  }

  return {
    t,
    getLocale,
    switchLocale,
    getLocales,
    spaceType,
    categoryLabel,
    labelFromKey,
    accountTypeLabel,
    roleLabel,
    memberStatusLabel,
    subscriptionStatusLabel,
    subscriptionFrequencyLabel,
    feedbackTypeLabel,
    intlLocale,
    displayCurrency,
    formatCurrency,
    resolveCurrency,
    formatShortDate: formatShortDateValue,
    formatShortDateWithYear: formatShortDateWithYearValue,
    formatOptionalDate: formatOptionalDateValue,
    formatDateTime: formatDateTimeValue,
    formatAbsAmount: formatAbsAmountValue
  }
}
