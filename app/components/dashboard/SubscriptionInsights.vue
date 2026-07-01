<script setup lang="ts">
// ANCHOR: SaaS Shield insights — cancellations, renewals, price moves
import { ENUM } from '#shared/prisma-enums'
import type { SubscriptionItem } from '~/types/financial'

const props = defineProps<{
  subscriptions: SubscriptionItem[]
}>()

const { t } = useAppI18n()

const insights = computed(() => {
  const subs = props.subscriptions
  return {
    cancelled: subs.filter(s => s.status === ENUM.subscription.CANCELLED).length,
    missed: subs.filter(s => s.status === ENUM.subscription.PAUSED && s.alert).length,
    priceUp: subs.filter(s =>
      s.alert && (s.status === ENUM.subscription.PRICE_CHANGED || (s.prev != null && (s.priceChangePercent ?? 0) > 0))
    ).length,
    priceDown: subs.filter(s =>
      s.alert && s.prev != null && (s.priceChangePercent ?? 0) < 0
    ).length
  }
})

const items = computed(() => {
  const list: Array<{ key: string, count: number, color: 'error' | 'warning' | 'success' | 'neutral' }> = []
  if (insights.value.priceUp) {
    list.push({ key: 'priceUp', count: insights.value.priceUp, color: 'error' })
  }
  if (insights.value.priceDown) {
    list.push({ key: 'priceDown', count: insights.value.priceDown, color: 'success' })
  }
  if (insights.value.missed) {
    list.push({ key: 'missed', count: insights.value.missed, color: 'warning' })
  }
  if (insights.value.cancelled) {
    list.push({ key: 'cancelled', count: insights.value.cancelled, color: 'neutral' })
  }
  return list
})
</script>

<template>
  <UCard
    v-if="items.length"
    :ui="{ body: 'p-4 sm:p-5' }"
  >
    <h2 class="mb-3 text-base font-semibold">
      {{ t('dashboard.subscriptions.insightsTitle') }}
    </h2>
    <p class="mb-4 text-sm text-muted">
      {{ t('dashboard.subscriptions.insightsSubtitle') }}
    </p>
    <div class="flex flex-wrap gap-2">
      <UBadge
        v-for="item in items"
        :key="item.key"
        :color="item.color"
        variant="subtle"
        size="md"
        :label="t(`dashboard.subscriptions.insights.${item.key}`, { count: item.count })"
      />
    </div>
  </UCard>
</template>
