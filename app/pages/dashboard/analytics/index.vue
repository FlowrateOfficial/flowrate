<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Analytics', middleware: 'auth' })

const { t } = useAppI18n()
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
  isSyncing
} = storeToRefs(analyticsStore)

const hasConnectedAccounts = computed(() => (data.value?.summary.linkedAccountCount ?? 0) > 0)

const spaceId = computed(() => useSpacesStore().activeSpace?.id)
await useAsyncData(
  () => `analytics-${spaceId.value}-${range.value}`,
  async () => {
    await analyticsStore.fetchOverview()
    return null
  },
  { watch: [spaceId, range] }
)

useSeoMeta({ title: () => `${t('dashboard.analytics.title')} — ${t('common.appName')}` })
</script>

<template>
  <div class="px-6 sm:px-10 py-10 sm:py-14 space-y-8 max-w-7xl mx-auto">
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
          :loading="isSyncing"
          @click="analyticsStore.syncTransactions()"
        />
        <UButton
          :label="t('dashboard.accounts.title')"
          icon="i-lucide-landmark"
          color="neutral"
          variant="ghost"
          to="/dashboard/accounts"
        />
      </template>
    </DashboardPageHeader>

    <UCard :ui="{ body: 'p-4' }">
      <UFormField :label="t('dashboard.analytics.periodLabel')">
        <UTabs v-model="range" :items="rangeTabs" :content="false" class="w-full" />
      </UFormField>
    </UCard>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

    <UCard v-if="!pending && !hasData" class="text-center py-16">
      <UIcon name="i-lucide-bar-chart-3" class="w-10 h-10 mx-auto mb-4 text-flow-muted opacity-40" />
      <h3 class="font-display text-xl mb-2">
        {{ hasConnectedAccounts ? t('dashboard.analytics.emptyTitleConnected') : t('dashboard.analytics.emptyTitle') }}
      </h3>
      <p class="text-sm text-flow-muted dark:text-flow-muted-dark max-w-md mx-auto mb-6">
        {{ hasConnectedAccounts ? t('dashboard.analytics.emptyDescriptionConnected') : t('dashboard.analytics.emptyDescription') }}
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <UButton
          v-if="!hasConnectedAccounts"
          :label="t('dashboard.overview.connectBank')"
          to="/dashboard/accounts"
          icon="i-lucide-landmark"
        />
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

    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <DashboardChartsChartCard
        :title="t('dashboard.analytics.cashFlow')"
        :subtitle="t('dashboard.analytics.cashFlowHint')"
      >
        <DashboardChartsCashFlowChart
          :labels="cashFlowLabels"
          :income="cashFlowIncome"
          :spending="cashFlowSpending"
        />
      </DashboardChartsChartCard>

      <DashboardChartsChartCard
        :title="t('dashboard.analytics.byCategory')"
        :subtitle="t('dashboard.analytics.byCategoryHint')"
      >
        <DashboardChartsCategoryChart
          :labels="categoryLabels"
          :values="categoryValues"
        />
      </DashboardChartsChartCard>

      <DashboardChartsChartCard
        :title="t('dashboard.analytics.netWorthTrend')"
        :subtitle="t('dashboard.analytics.netWorthHint')"
      >
        <DashboardChartsNetWorthChart
          :labels="netWorthLabels"
          :values="netWorthValues"
        />
      </DashboardChartsChartCard>

      <DashboardChartsChartCard
        :title="t('dashboard.analytics.topMerchants')"
        :subtitle="t('dashboard.analytics.topMerchantsHint')"
      >
        <DashboardChartsMerchantChart
          :labels="merchantLabels"
          :values="merchantValues"
        />
      </DashboardChartsChartCard>
    </div>

    <UCard v-if="data?.categories?.length" :ui="{ body: 'p-6 sm:p-8' }">
      <h3 class="font-display text-lg mb-6">{{ t('dashboard.analytics.insightsTitle') }}</h3>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard
          v-for="cat in data.categories.slice(0, 6)"
          :key="cat.category"
          :ui="{ body: 'p-4' }"
          variant="subtle"
        >
          <p class="text-xs text-flow-muted dark:text-flow-muted-dark mb-1">{{ analyticsStore.categoryLabel(cat.category) }}</p>
          <p class="text-xl font-light tabular-nums">{{ analyticsStore.fmt(cat.amount) }}</p>
          <UProgress
            class="mt-3"
            :model-value="data.summary.spending > 0 ? (cat.amount / data.summary.spending) * 100 : 0"
            color="primary"
            size="xs"
          />
          <p class="text-xs text-flow-muted mt-2">
            {{ data.summary.spending > 0 ? Math.round((cat.amount / data.summary.spending) * 100) : 0 }}%
            {{ t('dashboard.analytics.ofSpending') }}
          </p>
        </UCard>
      </div>
    </UCard>
  </div>
</template>
