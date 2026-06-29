<script setup lang="ts">
// ANCHOR: Subscriptions page — detected recurring charges
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Subscriptions', middleware: 'auth' })

const { t } = useAppI18n()
const subscriptionsStore = useSubscriptionsStore()
const { subscriptions, loading, activeCount, summaryItems } = storeToRefs(subscriptionsStore)

await useSpaceStoreFetch('subscriptions', () => subscriptionsStore.fetchSubscriptions())

useDashboardSeo('dashboard.subscriptions.title')
</script>

<template>
  <DashboardPageShell>
    <DashboardPageHeader
      :title="t('dashboard.subscriptions.title')"
      :description="t('dashboard.subscriptions.subtitle', { count: activeCount })"
    />

    <DashboardSummaryStrip :items="summaryItems" :loading="loading" />

    <DashboardCardSkeleton v-if="loading" :count="6" body-class="p-6" />

    <UCard v-else-if="!subscriptions.length" :ui="{ body: 'p-6 sm:p-8 text-center' }">
      <UEmpty
        icon="i-lucide-credit-card"
        :title="t('dashboard.subscriptions.emptyTitle')"
        :description="t('dashboard.subscriptions.emptyDescription')"
        variant="naked"
      />
    </UCard>

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardSubscriptionCard
        v-for="sub in subscriptions"
        :key="sub.id"
        :subscription="sub"
      />
    </div>
  </DashboardPageShell>
</template>
