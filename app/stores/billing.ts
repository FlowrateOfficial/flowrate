import { resolveErrorMessage } from '~/utils/errors'
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

export const useBillingStore = defineStore('billing', () => {
  const { t } = useAppI18n()
  const toast = useToast()
  const loading = ref(false)
  const plans = ref<StripePlanSummary[]>([])
  const plansLoading = ref(false)
  const pricingCadence = ref<PricingCadence>('monthly')
  const { api } = useApi()

  const billingInterval = computed<BillingInterval>(() =>
    pricingCadence.value === 'yearly' ? 'year' : 'month'
  )

  function planForKey(key: string, interval = billingInterval.value) {
    return plans.value.find(p => p.key === key && p.interval === interval)
      ?? plans.value.find(p => p.key === key && p.interval === 'month')
      ?? plans.value.find(p => p.key === key)
  }

  const proPlan = computed(() => planForKey('pro'))
  const enterprisePlan = computed(() => planForKey('enterprise'))

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

  async function startCheckout(planKey = 'pro', interval: BillingInterval = billingInterval.value) {
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
      toast.add({
        title: t('dashboard.settings.checkoutFailed'),
        description: resolveErrorMessage(e, t, 'dashboard.settings.tryAgain'),
        color: 'error'
      })
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
      toast.add({
        title: t('dashboard.settings.portalFailed'),
        description: resolveErrorMessage(e, t, 'dashboard.settings.tryAgain'),
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    plans,
    plansLoading,
    pricingCadence,
    billingInterval,
    proPlan,
    enterprisePlan,
    planForKey,
    fetchPlans,
    startCheckout,
    openPortal
  }
})
