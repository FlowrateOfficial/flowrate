<script setup lang="ts">
// ANCHOR: Subscriptions page — detected recurring charges + renewal calendar
import { storeToRefs } from 'pinia'
import { ENUM } from '#shared/prisma-enums'
import type { SubscriptionFilter } from '~/stores/subscriptions'

definePageMeta({ layout: 'dashboard', title: 'Subscriptions', middleware: 'auth' })

const { t, formatCurrency } = useAppI18n()
const subscriptionsStore = useSubscriptionsStore()
const {
  subscriptions,
  loading,
  activeCount,
  summaryItems,
  alertSubs,
  totalAnnualImpact,
  statusFilter,
  filterItems,
  actionPending,
  capStatus,
  calendar,
  calendarPending
} = storeToRefs(subscriptionsStore)

await useSpaceStoreFetch('subscriptions', async () => {
  await subscriptionsStore.fetchSubscriptions()
  await subscriptionsStore.fetchCalendar()
})

useDashboardSeo('dashboard.subscriptions.title')

const editOpen = ref(false)
const editingSub = ref<(typeof subscriptions.value)[number] | null>(null)

const priceChangeNames = computed(() =>
  alertSubs.value.slice(0, 3).map(sub => sub.name).join(', ')
)

const alertTitle = computed(() =>
  t(
    alertSubs.value.length === 1
      ? 'dashboard.subscriptions.alertTitle'
      : 'dashboard.subscriptions.alertTitlePlural',
    { count: alertSubs.value.length }
  )
)

const priceChangeDescription = computed(() => {
  const parts = [
    t('dashboard.subscriptions.priceChangeDescription', {
      names: priceChangeNames.value,
      verb: t(
        alertSubs.value.length === 1
          ? 'dashboard.subscriptions.priceChangeVerbSingular'
          : 'dashboard.subscriptions.priceChangeVerbPlural'
      )
    })
  ]

  if (totalAnnualImpact.value > 0) {
    parts.push(
      t('dashboard.subscriptions.priceChangeAnnualTotal', {
        amount: formatCurrency(
          totalAnnualImpact.value,
          alertSubs.value[0]?.currency ?? 'USD'
        )
      })
    )
  }

  return parts.join(' ')
})

function isHighlighted(sub: (typeof subscriptions.value)[number]) {
  return sub.alert
    || sub.status === ENUM.subscription.PRICE_CHANGED
    || sub.status === ENUM.subscription.PAUSED
    || sub.status === ENUM.subscription.CANCELLED
}

async function onFilterChange(value: string) {
  await subscriptionsStore.setFilter(value as SubscriptionFilter)
}

function openEdit(id: string) {
  editingSub.value = subscriptions.value.find(sub => sub.id === id) ?? null
  editOpen.value = true
}

async function saveEdit(patch: { displayName?: string | null, hidden?: boolean, excluded?: boolean }) {
  if (!editingSub.value) return
  await subscriptionsStore.patchSubscription(editingSub.value.id, patch)
  editOpen.value = false
  editingSub.value = null
}
</script>

<template>
  <DashboardPageShell>
    <DashboardPageHeader
      :title="t('dashboard.subscriptions.title')"
      :description="t('dashboard.subscriptions.subtitle', { count: activeCount })"
    />

    <UAlert
      v-if="capStatus?.exceeded"
      color="error"
      variant="subtle"
      icon="i-lucide-gauge"
      :title="t('dashboard.subscriptions.capExceededTitle')"
      :description="t('dashboard.subscriptions.capExceededDescription', {
        total: formatCurrency(capStatus.monthlyTotal, capStatus.currency),
        cap: formatCurrency(capStatus.cap, capStatus.currency)
      })"
      class="mb-4"
    />

    <UAlert
      v-if="alertSubs.length"
      color="warning"
      variant="subtle"
      icon="i-lucide-trending-up"
      :title="alertTitle"
      :description="priceChangeDescription"
      class="mb-4"
    />

    <div class="mb-4 flex flex-wrap gap-2">
      <UButton
        v-for="item in filterItems"
        :key="item.value"
        :label="item.label"
        :color="statusFilter === item.value ? 'primary' : 'neutral'"
        :variant="statusFilter === item.value ? 'solid' : 'outline'"
        size="sm"
        @click="onFilterChange(item.value)"
      />
    </div>

    <DashboardSummaryStrip :items="summaryItems" :loading="loading" />

    <DashboardSubscriptionInsights :subscriptions="subscriptions" />

    <UCard class="mb-4" :ui="{ body: 'p-4 sm:p-5' }">
      <h2 class="mb-4 text-base font-semibold">{{ t('dashboard.subscriptions.calendarTitle') }}</h2>
      <DashboardSubscriptionRenewalCalendar :data="calendar" :loading="calendarPending" />
    </UCard>

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
      <UCard
        v-for="sub in subscriptions"
        :key="sub.id"
        :ui="{
          body: 'p-4 sm:p-5',
          root: isHighlighted(sub) ? 'ring-1 ring-warning/40' : undefined
        }"
      >
        <DashboardSubscriptionCard
          :subscription="sub"
          show-actions
          :action-pending="actionPending === sub.id"
          :period-impact-label="subscriptionsStore.formatPeriodImpact(sub)"
          :annual-impact-label="subscriptionsStore.formatAnnualImpact(sub)"
          @dismiss="subscriptionsStore.dismissAlert"
          @merge="subscriptionsStore.mergeDuplicates"
          @edit="openEdit"
        />
      </UCard>
    </div>

    <DashboardSubscriptionEditModal
      v-model:open="editOpen"
      :subscription="editingSub"
      :pending="!!actionPending"
      @save="saveEdit"
    />
  </DashboardPageShell>
</template>
