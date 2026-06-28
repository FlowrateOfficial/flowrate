<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Subscriptions', middleware: 'auth' })

const { t } = useAppI18n()
const subscriptionsStore = useSubscriptionsStore()
const spacesStore = useSpacesStore()
const { subscriptions, loading, monthlyTotal, activeCount } = storeToRefs(subscriptionsStore)

const spaceId = computed(() => spacesStore.activeSpace?.id ?? '')

watch(spaceId, (id) => {
  if (id) subscriptionsStore.fetchSubscriptions(id)
}, { immediate: true })

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
</script>

<template>
  <div class="px-6 sm:px-10 py-10 sm:py-14 space-y-8 max-w-7xl mx-auto">
    <DashboardPageHeader
      :title="t('dashboard.subscriptions.title')"
      :description="t('dashboard.subscriptions.subtitle', { count: activeCount })"
    />

    <div class="grid sm:grid-cols-3 gap-4">
      <UCard :ui="{ body: 'p-5' }">
        <p class="text-xs uppercase tracking-widest text-muted">{{ t('dashboard.subscriptions.active') }}</p>
        <p class="font-display text-2xl mt-1">{{ activeCount }}</p>
      </UCard>
      <UCard :ui="{ body: 'p-5' }">
        <p class="text-xs uppercase tracking-widest text-muted">{{ t('dashboard.subscriptions.monthlyTotal') }}</p>
        <p class="font-display text-2xl mt-1">{{ formatMoney(monthlyTotal) }}</p>
      </UCard>
    </div>

    <div v-if="loading" class="text-center py-16 text-muted text-sm">{{ t('common.loading') }}</div>
    <div v-else-if="!subscriptions.length" class="text-center py-16">
      <p class="font-display text-lg">{{ t('dashboard.subscriptions.emptyTitle') }}</p>
      <p class="text-sm text-muted mt-2 max-w-md mx-auto">{{ t('dashboard.subscriptions.emptyDescription') }}</p>
    </div>
    <div v-else class="space-y-3">
      <UCard v-for="sub in subscriptions" :key="sub.id" :ui="{ body: 'p-4 sm:p-5' }">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="font-medium">{{ sub.name }}</p>
            <p class="text-xs text-muted mt-1">{{ sub.frequency ?? 'monthly' }}</p>
          </div>
          <p class="font-display">{{ formatMoney(sub.amount ?? 0) }}</p>
        </div>
      </UCard>
    </div>
  </div>
</template>
