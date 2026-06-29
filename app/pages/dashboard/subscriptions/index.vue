<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Subscriptions', middleware: 'auth' })

const { t, formatCurrency } = useAppI18n()
const subscriptionsStore = useSubscriptionsStore()
const spacesStore = useSpacesStore()
const { subscriptions, loading, monthlyTotal, activeCount } = storeToRefs(subscriptionsStore)

const spaceId = computed(() => spacesStore.space?.id ?? '')

await useAsyncData(
  () => `subscriptions-${spaceId.value}`,
  async () => {
    await subscriptionsStore.fetchSubscriptions(spaceId.value)
    return null
  },
  { watch: [spaceId] }
)

function formatMoney(amount: number, currency?: string) {
  return formatCurrency(amount, currency)
}

const summaryItems = computed(() => [
  { label: t('dashboard.subscriptions.active'), value: String(activeCount.value), icon: 'i-lucide-repeat' },
  { label: t('dashboard.subscriptions.monthlyTotal'), value: formatMoney(monthlyTotal.value), icon: 'i-lucide-calendar' }
])
</script>

<template>
  <DashboardPageShell>
    <DashboardPageHeader
      :title="t('dashboard.subscriptions.title')"
      :description="t('dashboard.subscriptions.subtitle', { count: activeCount })"
    />

    <DashboardSummaryStrip :items="summaryItems" :loading="loading" />

    <UCard v-if="loading" :ui="{ body: 'p-8 text-center' }">
      <UIcon name="i-lucide-loader-2" class="mx-auto size-6 animate-spin text-muted" />
    </UCard>

    <UCard v-else-if="!subscriptions.length" :ui="{ body: 'p-6 sm:p-8 text-center' }">
      <UEmpty
        icon="i-lucide-credit-card"
        :title="t('dashboard.subscriptions.emptyTitle')"
        :description="t('dashboard.subscriptions.emptyDescription')"
        variant="naked"
      />
    </UCard>

    <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <UCard v-for="sub in subscriptions" :key="sub.id" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate font-medium">{{ sub.name }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ sub.frequency ?? 'monthly' }}</p>
          </div>
          <p class="shrink-0 text-lg font-semibold tabular-nums">{{ formatMoney(sub.amount ?? 0, sub.currency) }}</p>
        </div>
      </UCard>
    </div>
  </DashboardPageShell>
</template>
