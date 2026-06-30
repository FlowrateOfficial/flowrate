<script setup lang="ts">
// ANCHOR: Subscription row — status badge + next charge + merchant logo
import type { SubscriptionItem } from '~/types/financial'
import { ENUM } from '#shared/prisma-enums'

const props = withDefaults(defineProps<{
  subscription: SubscriptionItem
  showActions?: boolean
  actionPending?: boolean
  periodImpactLabel?: string | null
  annualImpactLabel?: string | null
}>(), {
  showActions: false,
  actionPending: false,
  periodImpactLabel: null,
  annualImpactLabel: null
})

const emit = defineEmits<{
  dismiss: [id: string]
  merge: [id: string]
  edit: [id: string]
}>()

const { t, formatShortDate, formatCurrency, subscriptionStatusLabel, subscriptionFrequencyLabel } = useAppI18n()

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  [ENUM.subscription.ACTIVE]: 'success',
  [ENUM.subscription.PAUSED]: 'warning',
  [ENUM.subscription.CANCELLED]: 'neutral',
  [ENUM.subscription.PRICE_CHANGED]: 'error'
}

const showPriceDecrease = computed(() =>
  props.subscription.alert
  && props.subscription.prev != null
  && (props.subscription.priceChangePercent ?? 0) < 0
)

const showPriceIncrease = computed(() =>
  !showPriceDecrease.value && (
    props.subscription.alert
    || props.subscription.status === ENUM.subscription.PRICE_CHANGED
    || (props.subscription.prev != null && (props.subscription.priceChangePercent ?? 0) > 0)
  )
)

const showMissedRenewal = computed(() =>
  props.subscription.alert && props.subscription.status === ENUM.subscription.PAUSED
)

const showCancelled = computed(() =>
  props.subscription.status === ENUM.subscription.CANCELLED
)

const avatarLetter = computed(() => props.subscription.name.charAt(0).toUpperCase())
const logoFailed = ref(false)

watch(() => props.subscription.id, () => {
  logoFailed.value = false
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        <img
          v-if="subscription.logoUrl && !logoFailed"
          :src="subscription.logoUrl"
          :alt="subscription.name"
          class="w-full h-full object-contain p-1"
          loading="lazy"
          @error="logoFailed = true"
        >
        <span v-else class="text-sm font-bold">{{ avatarLetter }}</span>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="text-sm font-medium text-foreground truncate">{{ subscription.name }}</p>
          <UBadge
            v-if="showCancelled"
            :label="t('dashboard.subscriptions.likelyCancelled')"
            color="neutral"
            variant="subtle"
            size="xs"
          />
          <UBadge
            v-if="showPriceDecrease"
            :label="t('dashboard.subscriptions.priceDown')"
            color="success"
            variant="subtle"
            size="xs"
          />
          <UBadge
            v-if="showPriceIncrease && !showMissedRenewal"
            :label="t('dashboard.subscriptions.priceUp')"
            color="error"
            variant="subtle"
            size="xs"
          />
          <UBadge
            v-if="showMissedRenewal"
            :label="t('dashboard.subscriptions.missedRenewal')"
            color="warning"
            variant="subtle"
            size="xs"
          />
          <UBadge
            v-if="subscription.isDuplicate"
            :label="t('dashboard.subscriptions.duplicateCount', { count: subscription.duplicateCount })"
            color="warning"
            variant="subtle"
            size="xs"
          />
        </div>
        <div class="flex items-center gap-2 mt-0.5 flex-wrap">
          <UBadge
            :label="subscriptionStatusLabel(subscription.status)"
            :color="statusColors[subscription.status] ?? 'neutral'"
            variant="subtle"
            size="xs"
          />
          <span v-if="subscription.nextCharge" class="text-xs text-muted">
            {{ t('dashboard.subscriptions.nextCharge', { date: formatShortDate(subscription.nextCharge) }) }}
          </span>
        </div>
      </div>

      <div class="flex shrink-0 items-start gap-1">
        <UButton
          v-if="showActions"
          icon="i-lucide-pencil"
          color="neutral"
          variant="ghost"
          size="xs"
          :aria-label="t('dashboard.subscriptions.editTitle')"
          @click="emit('edit', subscription.id)"
        />
        <div class="text-right">
          <p
            v-if="subscription.prev != null"
            class="text-xs text-muted line-through tabular-nums"
          >
            {{ formatCurrency(subscription.prev, subscription.currency) }}
          </p>
          <p class="text-sm font-semibold tabular-nums">
            {{ formatCurrency(subscription.amount, subscription.currency) }}
            <span
              v-if="subscription.priceChangePercent != null && subscription.priceChangePercent > 0"
              class="ml-1 text-xs font-medium text-error"
            >
              +{{ subscription.priceChangePercent }}%
            </span>
          </p>
          <p v-if="periodImpactLabel" class="text-xs font-medium text-error tabular-nums">
            {{ periodImpactLabel }}
          </p>
          <p v-if="annualImpactLabel" class="text-xs text-muted tabular-nums">
            {{ annualImpactLabel }}
          </p>
          <p v-else class="text-xs text-muted">{{ subscriptionFrequencyLabel(subscription.frequency) }}</p>
        </div>
      </div>
    </div>

    <div v-if="showActions && (subscription.alert || subscription.isDuplicate)" class="flex flex-wrap gap-2">
      <UButton
        v-if="subscription.alert"
        :label="t('dashboard.subscriptions.dismiss')"
        color="neutral"
        variant="outline"
        size="xs"
        :loading="actionPending"
        @click="emit('dismiss', subscription.id)"
      />
      <UButton
        v-if="subscription.isDuplicate"
        :label="t('dashboard.subscriptions.mergeDuplicates')"
        color="warning"
        variant="soft"
        size="xs"
        :loading="actionPending"
        @click="emit('merge', subscription.id)"
      />
    </div>
  </div>
</template>
