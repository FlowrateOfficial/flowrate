<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { formatMediumDate } from '~/utils/format'

const props = defineProps<{
  ready?: boolean
}>()

const emit = defineEmits<{
  refreshed: []
}>()

const { t, formatCurrency, getLocale } = useAppI18n()
const billingStore = useBillingStore()
const userStore = useUserStore()
const {
  loading: billingLoading,
  previewLoading,
  pricingCadence,
  selectedPlanKey,
  changePreview,
  selectedPlan
} = storeToRefs(billingStore)
const { plan: userPlan, billing: billingInfo } = storeToRefs(userStore)

const hasActiveSubscription = computed(() =>
  Boolean(billingInfo.value?.subscription?.priceId) && userPlan.value !== 'FREE'
)

const planLabels = computed(() => ({
  FREE: { label: t('dashboard.settings.plans.FREE'), color: 'neutral' as const },
  PRO: { label: t('dashboard.settings.plans.PRO'), color: 'primary' as const },
  ENTERPRISE: { label: t('dashboard.settings.plans.ENTERPRISE'), color: 'success' as const }
}))

const planOptions = computed(() => {
  return [
    {
      key: 'pro',
      title: t('dashboard.settings.planOptions.pro'),
      price: billingStore.displayPriceForPlan(billingStore.planForKey('pro')),
      blurb: t('auth.register.planProDescription')
    },
    {
      key: 'enterprise',
      title: t('dashboard.settings.planOptions.enterprise'),
      price: billingStore.displayPriceForPlan(billingStore.planForKey('enterprise')),
      blurb: t('auth.register.planEnterpriseDescription')
    }
  ]
})

const previewLabel = computed(() => {
  const preview = changePreview.value
  if (!preview || preview.unchanged) return null
  const amount = formatCurrency(preview.amountDue, preview.currency)
  return preview.isCredit
    ? t('dashboard.settings.prorationCredit', { amount })
    : t('dashboard.settings.prorationCharge', { amount })
})

const renewalLabel = computed(() => {
  const sub = billingInfo.value?.subscription
  if (!sub?.periodEnd) return null
  const date = formatBillingDate(sub.periodEnd)
  return sub.cancelAtEnd
    ? t('dashboard.settings.cancelsOn', { date })
    : t('dashboard.settings.renewsOn', { date })
})

const statusDescription = computed(() =>
  hasActiveSubscription.value
    ? t('dashboard.settings.manageDescription')
    : t('dashboard.settings.upgradeDescription')
)

const primaryLabel = computed(() => {
  if (hasActiveSubscription.value) {
    return t('dashboard.settings.updatePlan')
  }
  if (selectedPlan.value) {
    return t('dashboard.settings.upgradeCtaWithPlan', {
      plan: selectedPlan.value.name,
      price: billingStore.displayPriceForPlan(selectedPlan.value)
    })
  }
  return t('dashboard.settings.upgradeCta')
})

watchDebounced(
  [selectedPlanKey, pricingCadence],
  async () => {
    if (!props.ready || !hasActiveSubscription.value) {
      changePreview.value = null
      return
    }
    try {
      await billingStore.previewChange()
    } catch {
      changePreview.value = null
    }
  },
  { debounce: 400 }
)

async function onPrimaryAction() {
  if (hasActiveSubscription.value) {
    const plan = await billingStore.changeSubscription()
    if (plan) emit('refreshed')
    return
  }
  await billingStore.startCheckout()
}

function formatBillingDate(iso: string) {
  return formatMediumDate(iso, getLocale())
}
</script>

<template>
  <div v-if="!ready" class="billing-panel-skeleton space-y-3" aria-busy="true">
    <div class="h-20 rounded-flow bg-elevated/50 animate-pulse" />
    <div class="grid grid-cols-2 gap-2">
      <div class="h-28 rounded-flow bg-elevated/40 animate-pulse" />
      <div class="h-28 rounded-flow bg-elevated/40 animate-pulse" />
    </div>
    <div class="h-10 w-48 rounded-flow bg-elevated/40 animate-pulse" />
    <div class="h-10 w-36 rounded-flow bg-elevated/40 animate-pulse" />
  </div>

  <div v-else class="billing-panel space-y-5">
    <div class="billing-status-card">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            {{ t('dashboard.settings.currentPlan') }}
          </p>
          <p class="mt-1 text-lg font-semibold text-default">
            {{ planLabels[userPlan]?.label ?? t('dashboard.settings.plans.FREE') }}
          </p>
          <p v-if="renewalLabel" class="mt-1 text-xs text-muted">
            {{ renewalLabel }}
          </p>
        </div>
        <UBadge
          :label="planLabels[userPlan]?.label ?? t('dashboard.settings.plans.FREE')"
          :color="planLabels[userPlan]?.color ?? 'neutral'"
          variant="subtle"
        />
      </div>
      <p class="mt-3 text-sm text-muted leading-relaxed">
        {{ statusDescription }}
      </p>
    </div>

    <div>
      <p class="billing-section-label">{{ t('dashboard.settings.choosePlan') }}</p>
      <div class="grid gap-2 sm:grid-cols-2">
        <button
          v-for="option in planOptions"
          :key="option.key"
          type="button"
          class="billing-plan-card"
          :class="selectedPlanKey === option.key && 'is-selected'"
          @click="selectedPlanKey = option.key"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm font-semibold text-default">{{ option.title }}</p>
            <UIcon
              v-if="selectedPlanKey === option.key"
              name="i-lucide-check-circle-2"
              class="size-4 shrink-0 text-primary"
            />
          </div>
          <p class="mt-2 text-lg font-light tabular-nums text-default">{{ option.price }}</p>
          <p class="mt-1 text-xs text-muted leading-relaxed">{{ option.blurb }}</p>
        </button>
      </div>
    </div>

    <div>
      <p class="billing-section-label">{{ t('dashboard.settings.billingCycle') }}</p>
      <div class="inline-flex rounded-flow border border-default p-1 bg-muted/20">
        <button
          type="button"
          class="rounded-[0.45rem] px-3.5 py-1.5 text-xs font-medium transition-colors"
          :class="pricingCadence === 'monthly' ? 'btn-segment-active' : 'text-muted hover:text-default'"
          @click="pricingCadence = 'monthly'"
        >
          {{ t('dashboard.settings.billingMonthly') }}
        </button>
        <button
          type="button"
          class="rounded-[0.45rem] px-3.5 py-1.5 text-xs font-medium transition-colors"
          :class="pricingCadence === 'yearly' ? 'btn-segment-active' : 'text-muted hover:text-default'"
          @click="pricingCadence = 'yearly'"
        >
          {{ t('dashboard.settings.billingYearly') }}
        </button>
      </div>
    </div>

    <div
      v-if="hasActiveSubscription"
      class="rounded-flow border border-default/60 bg-elevated/20 px-3 py-2.5 text-sm text-muted min-h-10 flex items-center"
    >
      <span v-if="previewLoading">{{ t('dashboard.settings.previewLoading') }}</span>
      <span v-else-if="previewLabel">{{ previewLabel }}</span>
      <span v-else-if="changePreview?.unchanged">{{ t('dashboard.settings.currentSelection') }}</span>
      <span v-else-if="billingInfo?.subscription?.periodEnd">
        {{ billingInfo.subscription.cancelAtEnd
          ? t('dashboard.settings.cancelsOn', { date: formatBillingDate(billingInfo.subscription.periodEnd) })
          : t('dashboard.settings.renewsOn', { date: formatBillingDate(billingInfo.subscription.periodEnd) })
        }}
      </span>
    </div>

    <p v-if="selectedPlan?.convertedForDisplay" class="text-xs text-muted">
      {{ t('dashboard.settings.billedInStripeCurrency') }}
    </p>

    <div class="flex flex-wrap gap-2 pt-1">
      <UButton
        :label="primaryLabel"
        :icon="hasActiveSubscription ? 'i-lucide-refresh-cw' : 'i-lucide-sparkles'"
        :loading="billingLoading"
        :disabled="hasActiveSubscription && (previewLoading || changePreview?.unchanged)"
        @click="onPrimaryAction"
      />
      <UButton
        v-if="hasActiveSubscription"
        :label="t('dashboard.settings.billingPortal')"
        icon="i-lucide-external-link"
        color="neutral"
        variant="outline"
        :loading="billingLoading"
        @click="billingStore.openPortal()"
      />
    </div>

    <p v-if="hasActiveSubscription" class="text-xs text-muted">
      {{ t('dashboard.settings.cancelViaPortal') }}
    </p>
  </div>
</template>
