<script setup lang="ts">
// ANCHOR: Analytics page — charts by range; refetch on range change
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Analytics', middleware: 'auth' })

const { t, displayCurrency } = useAppI18n()
const analyticsStore = useAnalyticsStore()
const {
  range,
  data,
  pending,
  rangeTabs,
  cashFlowLabels,
  cashFlowIncome,
  cashFlowSpending,
  categoryLabels,
  categoryValues,
  merchantLabels,
  merchantValues,
  netWorthLabels,
  netWorthValues,
  hasData,
  summaryCurrency,
  isSyncing
} = storeToRefs(analyticsStore)

const hasConnectedAccounts = computed(() => (data.value?.summary.linkedAccountCount ?? 0) > 0)

await useSpaceStoreFetch(
  'analytics',
  () => analyticsStore.fetchOverview(),
  [range, displayCurrency]
)

useDashboardSeo('dashboard.analytics.title')
</script>

<template>
  <DashboardPageShell :show-guide="false">
    <DashboardPageHeader
      :title="t('dashboard.analytics.title')"
      :description="t('dashboard.analytics.subtitle')"
    >
      <template #actions>
        <UButton
          :label="t('dashboard.analytics.syncData')"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          size="sm"
          :loading="isSyncing"
          @click="analyticsStore.syncTransactions()"
        />
        <UButton
          :label="t('dashboard.accounts.title')"
          icon="i-lucide-landmark"
          color="neutral"
          variant="ghost"
          size="sm"
          to="/dashboard/accounts"
        />
      </template>
    </DashboardPageHeader>

    <UCard :ui="{ body: 'p-3 sm:p-4' }">
      <UFormField :label="t('dashboard.analytics.periodLabel')">
        <UTabs v-model="range" :items="rangeTabs" :content="false" class="w-full" />
      </UFormField>
    </UCard>

    <div class="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
      <DashboardStatsCard
        :title="t('dashboard.analytics.netWorth')"
        :value="data?.summary.totalBalance != null ? analyticsStore.fmt(data.summary.totalBalance) : '—'"
        icon="i-lucide-landmark"
        :loading="pending"
      />
      <DashboardStatsCard
        :title="t('dashboard.analytics.income')"
        :value="data?.summary.income != null ? analyticsStore.fmt(data.summary.income) : '—'"
        icon="i-lucide-arrow-down-to-line"
        :loading="pending"
      />
      <DashboardStatsCard
        :title="t('dashboard.analytics.spending')"
        :value="data?.summary.spending != null ? analyticsStore.fmt(data.summary.spending) : '—'"
        icon="i-lucide-arrow-up-from-line"
        :loading="pending"
      />
      <DashboardStatsCard
        :title="t('dashboard.analytics.savingsRate')"
        :value="data?.summary.savingsRate != null ? `${data.summary.savingsRate}%` : '—'"
        icon="i-lucide-percent"
        :loading="pending"
      />
    </div>

    <UCard v-if="!pending && !hasData" :ui="{ body: 'p-6 sm:p-8 text-center' }">
      <UIcon name="i-lucide-bar-chart-3" class="mx-auto mb-3 size-8 text-muted opacity-40" />
      <h3 class="mb-1 text-base font-semibold">
        {{ hasConnectedAccounts ? t('dashboard.analytics.emptyTitleConnected') : t('dashboard.analytics.emptyTitle') }}
      </h3>
      <p class="mx-auto mb-4 max-w-md text-sm text-muted">
        {{ hasConnectedAccounts ? t('dashboard.analytics.emptyDescriptionConnected') : t('dashboard.analytics.emptyDescription') }}
      </p>
      <div class="flex flex-wrap items-center justify-center gap-2">
        <DashboardConnectBank v-if="!hasConnectedAccounts" />
        <UButton
          :label="t('dashboard.analytics.syncData')"
          icon="i-lucide-refresh-cw"
          :color="hasConnectedAccounts ? 'primary' : 'neutral'"
          :variant="hasConnectedAccounts ? 'solid' : 'outline'"
          :loading="isSyncing"
          @click="analyticsStore.syncTransactions()"
        />
      </div>
    </UCard>

    <div v-else class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <DashboardChartsChartCard
        :title="t('dashboard.analytics.cashFlow')"
        :subtitle="t('dashboard.analytics.cashFlowHint')"
      >
        <DashboardChartsCashFlowChart
          :labels="cashFlowLabels"
          :income="cashFlowIncome"
          :spending="cashFlowSpending"
          :currency="summaryCurrency"
        />
      </DashboardChartsChartCard>

      <DashboardChartsChartCard
        :title="t('dashboard.analytics.byCategory')"
        :subtitle="t('dashboard.analytics.byCategoryHint')"
      >
        <DashboardChartsCategoryChart
          :labels="categoryLabels"
          :values="categoryValues"
          :currency="summaryCurrency"
        />
      </DashboardChartsChartCard>

      <DashboardChartsChartCard
        :title="t('dashboard.analytics.netWorthTrend')"
        :subtitle="t('dashboard.analytics.netWorthHint')"
      >
        <DashboardChartsNetWorthChart
          :labels="netWorthLabels"
          :values="netWorthValues"
          :currency="summaryCurrency"
        />
      </DashboardChartsChartCard>

      <DashboardChartsChartCard
        :title="t('dashboard.analytics.topMerchants')"
        :subtitle="t('dashboard.analytics.topMerchantsHint')"
      >
        <DashboardChartsMerchantChart
          :labels="merchantLabels"
          :values="merchantValues"
          :currency="summaryCurrency"
        />
      </DashboardChartsChartCard>
    </div>

    <UCard v-if="data?.categories?.length" :ui="{ body: 'p-4 sm:p-5' }">
      <h3 class="mb-3 text-base font-semibold">{{ t('dashboard.analytics.insightsTitle') }}</h3>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <UCard
          v-for="cat in data.categories.slice(0, 6)"
          :key="cat.category"
          :ui="{ body: 'p-3 sm:p-4' }"
          variant="subtle"
        >
          <p class="mb-0.5 text-xs font-medium text-muted">{{ analyticsStore.categoryLabel(cat.category) }}</p>
          <p class="text-lg font-semibold tabular-nums">{{ analyticsStore.fmt(cat.amount) }}</p>
          <UProgress
            class="mt-2"
            :model-value="data.summary.spending > 0 ? (cat.amount / data.summary.spending) * 100 : 0"
            color="primary"
            size="xs"
          />
          <p class="mt-1.5 text-xs text-muted">
            {{ data.summary.spending > 0 ? Math.round((cat.amount / data.summary.spending) * 100) : 0 }}%
            {{ t('dashboard.analytics.ofSpending') }}
          </p>
        </UCard>
      </div>
    </UCard>
  </DashboardPageShell>
</template>
