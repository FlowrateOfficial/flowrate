import { resolveErrorMessage } from '~/utils/errors'
import { apiRoutes, useApi } from '~/lib/api'

export interface StripePlanSummary {
  key: string
  productId: string
  priceId: string
  name: string
  description: string | null
  amount: number
  currency: string
  interval: 'day' | 'week' | 'month' | 'year' | null
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
  const { api } = useApi()

  const proPlan = computed(() => plans.value.find(p => p.key === 'pro'))

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

  async function startCheckout(planKey = 'pro') {
    loading.value = true
    try {
      const pro = plans.value.find(p => p.key === planKey)
      const { url } = await api<{ url: string }>(apiRoutes.stripe.checkout, {
        method: 'POST',
        body: {
          planKey,
          priceId: pro?.priceId
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
    proPlan,
    fetchPlans,
    startCheckout,
    openPortal
  }
})
