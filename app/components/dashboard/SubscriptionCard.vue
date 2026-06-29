<script setup lang="ts">
// ANCHOR: Subscription row — status badge + next charge
import type { SubscriptionItem } from '~/types/financial'

defineProps<{ subscription: SubscriptionItem }>()

const { t, formatShortDate, formatCurrency, subscriptionStatusLabel, subscriptionFrequencyLabel } = useAppI18n()

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  CANCELLED: 'neutral',
  PRICE_CHANGED: 'error'
}
</script>

<template>
  <div class="flex items-center gap-3 py-3">
    <div class="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-sm font-bold">
      {{ subscription.name.charAt(0).toUpperCase() }}
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <p class="text-sm font-medium text-foreground truncate">{{ subscription.name }}</p>
        <UBadge
          v-if="subscription.alert"
          :label="t('dashboard.subscriptions.priceUp')"
          color="error"
          variant="subtle"
          size="xs"
        />
      </div>
      <div class="flex items-center gap-2 mt-0.5">
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

    <div class="text-right shrink-0">
      <p class="text-sm font-semibold tabular-nums">
        {{ formatCurrency(subscription.amount, subscription.currency) }}
      </p>
      <p class="text-xs text-muted">{{ subscriptionFrequencyLabel(subscription.frequency) }}</p>
    </div>
  </div>
</template>
