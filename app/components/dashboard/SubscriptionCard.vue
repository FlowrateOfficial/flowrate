<script setup lang="ts">
import type { SubscriptionItem } from '~/types/financial'
import { formatCurrencyForLocale } from '~/utils/format'

defineProps<{ subscription: SubscriptionItem }>()

const { t, getLocale, intlLocale } = useAppI18n()

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  CANCELLED: 'neutral',
  PRICE_CHANGED: 'error'
}

function statusLabel(status: string) {
  const key = `dashboard.subscriptions.status.${status}`
  const translated = t(key)
  return translated !== key ? translated : status
}

function frequencyLabel(freq: string | null) {
  if (!freq) return '—'
  const key = `dashboard.subscriptions.frequency.${freq}`
  const translated = t(key)
  return translated !== key ? translated : freq
}

function fmt(amount: number, currency: string): string {
  return formatCurrencyForLocale(amount, getLocale(), currency)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat(intlLocale.value, { month: 'short', day: 'numeric' }).format(new Date(dateStr))
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
          v-if="subscription.priceAlert"
          :label="t('dashboard.subscriptions.priceUp')"
          color="error"
          variant="subtle"
          size="xs"
        />
      </div>
      <div class="flex items-center gap-2 mt-0.5">
        <UBadge
          :label="statusLabel(subscription.status)"
          :color="statusColors[subscription.status] ?? 'neutral'"
          variant="subtle"
          size="xs"
        />
        <span v-if="subscription.nextCharge" class="text-xs text-muted">
          {{ t('dashboard.subscriptions.nextCharge', { date: formatDate(subscription.nextCharge) }) }}
        </span>
      </div>
    </div>

    <div class="text-right shrink-0">
      <p class="text-sm font-semibold tabular-nums">
        {{ fmt(subscription.amount, subscription.currency) }}
      </p>
      <p class="text-xs text-muted">{{ frequencyLabel(subscription.frequency) }}</p>
    </div>
  </div>
</template>
