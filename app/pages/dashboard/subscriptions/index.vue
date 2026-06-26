<script setup lang="ts">
import { formatCurrencyForLocale } from '~/utils/format'

definePageMeta({ layout: 'dashboard', title: 'Subscriptions', middleware: 'auth' })

const { t, getLocale } = useAppI18n()
useSeoMeta({ title: () => `${t('dashboard.subscriptions.title')} — ${t('common.appName')}` })

const filter = ref<'all' | 'active' | 'price_changed' | 'cancelled'>('all')

const { data: subs, pending } = await useFetch('/api/subscriptions', {
  query: computed(() => ({
    status: filter.value === 'all' ? undefined : filter.value.toUpperCase()
  }))
})

const priceAlerts = computed(() =>
  (subs.value ?? []).filter(s => s.priceAlert || s.status === 'PRICE_CHANGED')
)

const totalMonthly = computed(() => {
  return (subs.value ?? [])
    .filter(s => s.status === 'ACTIVE' && s.frequency === 'MONTHLY')
    .reduce((sum, s) => sum + s.amount, 0)
})

const filterItems = computed(() => [
  { key: 'all' as const, label: t('dashboard.subscriptions.filters.all') },
  { key: 'active' as const, label: t('dashboard.subscriptions.filters.active') },
  { key: 'price_changed' as const, label: t('dashboard.subscriptions.filters.priceChanged') },
  { key: 'cancelled' as const, label: t('dashboard.subscriptions.filters.cancelled') }
])

const priceAlertTitle = computed(() => {
  const count = priceAlerts.value.length
  return count === 1
    ? t('dashboard.subscriptions.priceChangeTitle', { count })
    : t('dashboard.subscriptions.priceChangeTitlePlural', { count })
})

const priceAlertDescription = computed(() => {
  const count = priceAlerts.value.length
  const names = priceAlerts.value.map(s => s.name).join(', ')
  const verb = count === 1
    ? t('dashboard.subscriptions.priceChangeVerbSingular')
    : t('dashboard.subscriptions.priceChangeVerbPlural')
  return t('dashboard.subscriptions.priceChangeDescription', { names, verb })
})

function fmt(amount: number, currency = 'USD') {
  return formatCurrencyForLocale(amount, getLocale(), currency)
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-5xl mx-auto">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">{{ t('dashboard.subscriptions.title') }}</h1>
      <p class="text-sm text-muted mt-1">
        {{ t('dashboard.subscriptions.subtitle') }}
        <span class="font-semibold text-foreground">{{ fmt(totalMonthly) }}</span>
      </p>
    </div>

    <UAlert
      v-if="priceAlerts.length"
      :title="priceAlertTitle"
      :description="priceAlertDescription"
      color="error"
      variant="subtle"
      icon="i-lucide-shield-alert"
    />

    <div class="flex gap-2 flex-wrap">
      <UButton
        v-for="f in filterItems"
        :key="f.key"
        :label="f.label"
        size="xs"
        :color="filter === f.key ? 'primary' : 'neutral'"
        :variant="filter === f.key ? 'solid' : 'subtle'"
        @click="filter = f.key"
      />
    </div>

    <UCard v-if="pending">
      <div v-for="i in 6" :key="i" class="flex items-center gap-3 py-3 border-b border-default last:border-0 animate-pulse">
        <div class="w-9 h-9 rounded-lg bg-muted/50 shrink-0" />
        <div class="flex-1 space-y-1.5">
          <div class="h-3.5 w-32 bg-muted/50 rounded" />
          <div class="h-3 w-20 bg-muted/30 rounded" />
        </div>
        <div class="h-4 w-16 bg-muted/50 rounded" />
      </div>
    </UCard>

    <UCard v-else-if="!subs?.length" class="text-center py-12">
      <UIcon name="i-lucide-refresh-cw" class="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
      <h3 class="font-semibold mb-1">{{ t('dashboard.subscriptions.emptyTitle') }}</h3>
      <p class="text-sm text-muted">
        {{ t('dashboard.subscriptions.emptyDescription') }}
      </p>
    </UCard>

    <UCard v-else>
      <ul class="divide-y divide-default">
        <li v-for="sub in subs" :key="sub.id">
          <DashboardSubscriptionCard :subscription="sub" />
        </li>
      </ul>
    </UCard>

    <UAlert
      icon="i-lucide-shield-check"
      :title="t('dashboard.subscriptions.shieldTitle')"
      :description="t('dashboard.subscriptions.shieldDescription')"
      color="primary"
      variant="subtle"
    />
  </div>
</template>
