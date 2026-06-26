<script setup lang="ts">
import { formatCurrencyForLocale } from '~/utils/format'

definePageMeta({ layout: 'dashboard', title: 'Company', middleware: 'auth' })

const { t, getLocale } = useAppI18n()
useSeoMeta({ title: () => `${t('dashboard.company.title')} — ${t('common.appName')}` })

const { activeSpace } = useActiveSpace()
const spaceId = computed(() => activeSpace.value?.id)

const { data: burnRate } = await useFetch(() => `/api/spaces/${spaceId.value}/company/burn-rate`, {
  watch: [spaceId]
})

function fmt(n: number) {
  return formatCurrencyForLocale(n, getLocale(), 'USD')
}

function runwayLabel(months: number | null | undefined) {
  if (!months) return t('dashboard.company.stats.infinite')
  return t('dashboard.company.stats.months', { count: months })
}
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto space-y-8">
    <div>
      <h1 class="text-2xl font-bold">{{ t('dashboard.company.title') }}</h1>
      <p class="text-sm text-muted mt-1">{{ t('dashboard.company.subtitle') }}</p>
    </div>

    <div v-if="activeSpace?.type !== 'COMPANY'" class="text-center py-12">
      <UIcon name="i-lucide-building-2" class="w-12 h-12 mx-auto text-muted opacity-40 mb-3" />
      <p class="text-muted mb-4">{{ t('dashboard.company.switchHint') }}</p>
      <UButton to="/dashboard/spaces" :label="t('dashboard.spaces.manageSpaces')" />
    </div>

    <template v-else-if="burnRate">
      <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardStatsCard
          :title="t('dashboard.company.stats.cash')"
          :value="fmt(burnRate.cash)"
          icon="i-lucide-landmark"
        />
        <DashboardStatsCard
          :title="t('dashboard.company.stats.burn')"
          :value="fmt(burnRate.netBurn)"
          icon="i-lucide-flame"
          :trend="burnRate.netBurn > 0 ? 'down' : 'up'"
        />
        <DashboardStatsCard
          :title="t('dashboard.company.stats.runway')"
          :value="runwayLabel(burnRate.runwayMonths)"
          icon="i-lucide-timer"
        />
        <DashboardStatsCard
          :title="t('dashboard.company.stats.waste')"
          :value="fmt(burnRate.subscriptionWaste)"
          icon="i-lucide-shield-alert"
        />
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <UCard>
          <template #header>
            <h2 class="font-semibold">{{ t('dashboard.company.monthlyBreakdown') }}</h2>
          </template>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-muted">{{ t('dashboard.company.income') }}</dt>
              <dd class="font-medium text-green-600">{{ fmt(burnRate.monthlyIncome) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">{{ t('dashboard.company.expenses') }}</dt>
              <dd class="font-medium">{{ fmt(burnRate.monthlyBurn) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">{{ t('dashboard.company.subscriptions') }}</dt>
              <dd class="font-medium">{{ fmt(burnRate.monthlySubscriptions) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">{{ t('dashboard.company.cloudDev') }}</dt>
              <dd class="font-medium">{{ fmt(burnRate.cloudSpend) }}</dd>
            </div>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">{{ t('dashboard.company.saasShield') }}</h2>
          </template>
          <p class="text-sm text-muted mb-3">
            {{ t('dashboard.company.activeSubs', { count: burnRate.activeSubscriptions }) }}
            <span v-if="burnRate.subscriptionWaste > 0" class="text-amber-600">
              {{ t('dashboard.company.duplicateWaste', { amount: fmt(burnRate.subscriptionWaste) }) }}
            </span>
          </p>
          <UButton
            to="/dashboard/subscriptions"
            :label="t('dashboard.company.reviewSubs')"
            variant="subtle"
            block
          />
        </UCard>
      </div>
    </template>
  </div>
</template>
