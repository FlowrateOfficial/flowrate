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

const LOCALE_COOKIE = 'user-locale'

export function useAppI18n() {
  const { t: rawT, getLocale: getI18nLocale, switchLocale, getLocales } = useI18n()
  const localeCookie = useCookie<string | null>(LOCALE_COOKIE)
  const localeState = useState<string | null>('i18n-locale', () => null)

  // NOTE - nuxt-i18n-micro getLocale() is not reactive in computed contexts; track cookie + state instead
  const locale = computed(() => localeState.value ?? localeCookie.value ?? getI18nLocale() ?? 'en')
  const getLocale = () => locale.value

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

  const intlLocale = computed(() => intlLocaleFor(locale.value))
  const displayCurrency = computed<DisplayCurrency>(() => currencyForLocale(locale.value))

  function formatCurrency(amount: number, currency?: string) {
    return formatMoney(amount, locale.value, currency)
  }

  function resolveCurrency(items: Array<{ currency?: string | null }> = []) {
    return resolveDisplayCurrency(locale.value, items)
  }

  function formatShortDateValue(iso: string) {
    return formatShortDate(iso, locale.value)
  }

  function formatShortDateWithYearValue(iso: string) {
    return formatShortDateWithYear(iso, locale.value)
  }

  function formatOptionalDateValue(
    iso: string | null | undefined,
    style: 'short' | 'medium' = 'medium'
  ) {
    return formatOptionalDate(iso, locale.value, style)
  }

  function formatDateTimeValue(iso: string) {
    return formatDateTime(iso, locale.value)
  }

  function formatAbsAmountValue(amount: number, currency: string) {
    return formatAbsAmount(amount, locale.value, currency)
  }

  return {
    t,
    locale,
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
