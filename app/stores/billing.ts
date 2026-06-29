import type { AppPlan } from '#shared/billing'
import type { UserBillingInfo } from '~/types/user'
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
  const { t } = useAppI18n()
  const appToast = useAppToast()
  const loading = ref(false)
  const previewLoading = ref(false)
  const plans = ref<StripePlanSummary[]>([])
  const plansLoading = ref(false)
  const pricingCadence = ref<PricingCadence>('monthly')
  const selectedPlanKey = ref('pro')
  const changePreview = ref<SubscriptionChangePreview | null>(null)
  const { api } = useApi()

  const billingInterval = computed<BillingInterval>(() =>
    pricingCadence.value === 'yearly' ? 'year' : 'month'
  )

  function planForKey(key: string, interval = billingInterval.value) {
    return plans.value.find(p => p.key === key && p.interval === interval)
      ?? plans.value.find(p => p.key === key && p.interval === 'month')
      ?? plans.value.find(p => p.key === key)
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

  async function fetchPlans() {
    plansLoading.value = true
    try {
      const data = await api<{ plans: StripePlanSummary[] }>(apiRoutes.stripe.plans, { noSpace: true })
      plans.value = data.plans
    } catch {
      plans.value = []
    } finally {
      plansLoading.value = false
    }
  }

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
          interval
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

  return {
    loading,
    previewLoading,
    plans,
    plansLoading,
    pricingCadence,
    selectedPlanKey,
    changePreview,
    billingInterval,
    proPlan,
    enterprisePlan,
    selectedPlan,
    planForKey,
    intervalForPriceId,
    applyBillingContext,
    fetchPlans,
    previewChange,
    startCheckout,
    changeSubscription,
    openPortal
  }
})
