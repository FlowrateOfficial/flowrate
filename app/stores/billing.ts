import type { AppPlan } from '#shared/billing'
import { matchStripePlan } from '#shared/billing-plans'
import { convertWithPresentmentMarkup } from '#shared/fx'
import type { UserBillingInfo, UserProfile } from '~/types/user'
import { apiRoutes } from '~/lib/api/endpoints'
import { useApi } from '~/lib/api/useApi'

export type BillingInterval = 'month' | 'year'
export type PricingCadence = 'monthly' | 'yearly'

export interface StripePlanSummary {
  key: string
  productId: string
  priceId: string
  name: string
  description: string | null
  amount: number
  currency: string
  interval: BillingInterval | null
  intervalCount: number
  formattedPrice: string
  formattedPeriod?: string
  convertedForDisplay?: boolean
}

export interface SubscriptionChangePreview {
  unchanged: boolean
  amountDue: number
  currency: string
  isCredit: boolean
  planKey: string
  interval: BillingInterval
  currentPriceId: string | null
  targetPriceId: string
}

export const useBillingStore = defineStore('billing', () => {
  const { t, displayCurrency, formatCurrency, getLocale, locale } = useAppI18n()
  const { rates, ensureRates } = useFxRates()
  const appToast = useAppToast()
  const loading = ref(false)
  const previewLoading = ref(false)
  const plans = ref<StripePlanSummary[]>([])
  const catalog = ref<StripePlanSummary[]>([])
  const preferredCurrency = ref<string | null>(null)
  const plansLoading = ref(false)
  const pricingCadence = ref<PricingCadence>('monthly')
  const selectedPlanKey = ref('pro')
  const changePreview = ref<SubscriptionChangePreview | null>(null)
  const settingsPending = ref(false)
  const { api } = useApi()

  const billingInterval = computed<BillingInterval>(() =>
    pricingCadence.value === 'yearly' ? 'year' : 'month'
  )

  function planForKey(key: string, interval = billingInterval.value, currency = preferredCurrency.value ?? displayCurrency.value) {
    return matchStripePlan(catalog.value, { planKey: key, interval, currency })
      ?? matchStripePlan(catalog.value, { planKey: key, interval })
  }

  function intervalForPriceId(priceId: string | null | undefined): BillingInterval | null {
    if (!priceId) return null
    return plans.value.find(p => p.priceId === priceId)?.interval ?? null
  }

  function cadenceFromInterval(interval: BillingInterval | null): PricingCadence {
    return interval === 'year' ? 'yearly' : 'monthly'
  }

  function applyBillingContext(billing: UserBillingInfo | null | undefined, plan: AppPlan) {
    const sub = billing?.subscription
    if (sub?.planKey) {
      selectedPlanKey.value = sub.planKey.toLowerCase()
    } else if (plan === 'ENTERPRISE') {
      selectedPlanKey.value = 'enterprise'
    } else if (plan === 'PRO') {
      selectedPlanKey.value = 'pro'
    }

    const interval = intervalForPriceId(sub?.priceId)
    if (interval) {
      pricingCadence.value = cadenceFromInterval(interval)
    }
  }

  const proPlan = computed(() => planForKey('pro'))
  const enterprisePlan = computed(() => planForKey('enterprise'))
  const selectedPlan = computed(() => planForKey(selectedPlanKey.value))

  function displayPriceForPlan(plan: StripePlanSummary | undefined): string {
    if (!plan) return '—'
    const target = displayCurrency.value
    const source = plan.currency.toUpperCase()
    if (source === target) {
      return `${formatCurrency(plan.amount, target)}${plan.formattedPeriod ?? ''}`
    }
    if (rates.value) {
      const amount = convertWithPresentmentMarkup(plan.amount, source, target, rates.value)
      return `${formatCurrency(amount, target)}${plan.formattedPeriod ?? ''}`
    }
    const catalogPlan = matchStripePlan(catalog.value, {
      planKey: plan.key,
      interval: plan.interval ?? billingInterval.value,
      currency: target
    })
    if (catalogPlan && catalogPlan.currency.toUpperCase() === target) {
      return `${formatCurrency(catalogPlan.amount, target)}${plan.formattedPeriod ?? ''}`
    }
    return `${plan.formattedPrice}${plan.formattedPeriod ?? ''}`
  }

  async function fetchPlans() {
    plansLoading.value = true
    try {
      await ensureRates()
      const data = await api<{
        plans: StripePlanSummary[]
        catalog: StripePlanSummary[]
        preferredCurrency?: string
      }>(apiRoutes.stripe.plans, {
        query: { locale: getLocale() },
        noSpace: true
      })
      plans.value = data.plans
      catalog.value = data.catalog?.length ? data.catalog : data.plans
      preferredCurrency.value = data.preferredCurrency ?? displayCurrency.value
    } catch {
      plans.value = []
      catalog.value = []
    } finally {
      plansLoading.value = false
    }
  }

  watch([displayCurrency, locale], () => {
    void fetchPlans()
  })

  async function previewChange(
    planKey = selectedPlanKey.value,
    interval: BillingInterval = billingInterval.value
  ) {
    previewLoading.value = true
    changePreview.value = null
    try {
      changePreview.value = await api<SubscriptionChangePreview>(
        apiRoutes.stripe.previewSubscriptionChange,
        {
          method: 'POST',
          body: { planKey, interval },
          noSpace: true
        }
      )
      return changePreview.value
    } catch (e) {
      if (e && typeof e === 'object' && 'statusCode' in e && (e as { statusCode: number }).statusCode === 404) {
        changePreview.value = null
        return null
      }
      throw e
    } finally {
      previewLoading.value = false
    }
  }

  async function startCheckout(planKey = selectedPlanKey.value, interval: BillingInterval = billingInterval.value) {
    loading.value = true
    try {
      const selected = planForKey(planKey, interval)
      const { url } = await api<{ url: string }>(apiRoutes.stripe.checkout, {
        method: 'POST',
        body: {
          planKey,
          priceId: selected?.priceId,
          interval,
          currency: preferredCurrency.value ?? displayCurrency.value
        },
        noSpace: true
      })
      window.location.href = url
    } catch (e) {
      appToast.errorFrom(e, 'dashboard.settings.tryAgain', t('dashboard.settings.checkoutFailed'))
    } finally {
      loading.value = false
    }
  }

  async function changeSubscription(
    planKey = selectedPlanKey.value,
    interval: BillingInterval = billingInterval.value
  ): Promise<AppPlan | null> {
    loading.value = true
    try {
      const result = await api<{
        plan: AppPlan
        unchanged: boolean
        planKey: string
        interval: BillingInterval
      }>(apiRoutes.stripe.changeSubscription, {
        method: 'POST',
        body: { planKey, interval },
        noSpace: true
      })

      if (result.unchanged) {
        appToast.neutral(t('dashboard.settings.planUnchanged'))
      } else {
        appToast.success(t('dashboard.settings.planUpdated'))
      }

      changePreview.value = null
      return result.plan
    } catch (e) {
      if (e && typeof e === 'object' && 'statusCode' in e && (e as { statusCode: number }).statusCode === 404) {
        await startCheckout(planKey, interval)
        return null
      }
      appToast.errorFrom(e, 'dashboard.settings.tryAgain', t('dashboard.settings.planChangeFailed'))
      return null
    } finally {
      loading.value = false
    }
  }

  async function openPortal() {
    loading.value = true
    try {
      const { url } = await api<{ url: string }>(apiRoutes.stripe.billingPortal, {
        method: 'POST',
        noSpace: true
      })
      window.location.href = url
    } catch (e) {
      appToast.errorFrom(e, 'dashboard.settings.tryAgain', t('dashboard.settings.portalFailed'))
    } finally {
      loading.value = false
    }
  }

  async function loadSettings(options?: { checkoutSessionId?: string }) {
    const userStore = useUserStore()
    settingsPending.value = true
    try {
      await fetchPlans()
      const profile = await userStore.fetchProfile({
        syncBilling: true,
        checkoutSessionId: options?.checkoutSessionId
      })
      if (!profile) return null

      userStore.applySettingsForm(profile)
      applyBillingContext(profile.billing, profile.plan)

      if (profile.plan !== 'FREE' && profile.billing?.subscription?.priceId) {
        await previewChange().catch(() => null)
      }

      return profile
    } finally {
      settingsPending.value = false
    }
  }

  return {
    loading,
    previewLoading,
    settingsPending,
    plans,
    catalog,
    preferredCurrency,
    plansLoading,
    pricingCadence,
    selectedPlanKey,
    changePreview,
    billingInterval,
    proPlan,
    enterprisePlan,
    selectedPlan,
    displayPriceForPlan,
    planForKey,
    intervalForPriceId,
    applyBillingContext,
    fetchPlans,
    previewChange,
    startCheckout,
    changeSubscription,
    openPortal,
    loadSettings
  }
})
