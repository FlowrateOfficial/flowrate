<script setup lang="ts">
// ANCHOR: Dashboard overview — stats, charts, recent activity
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Overview', middleware: 'auth' })

const { t } = useAppI18n()
const dashboardStore = useDashboardStore()

useDashboardSeo('dashboard.overview.title')

const {
  statsLoading,
  txLoading,
  spaceTypeLabel,
  spaceName,
  cashFlowLabels,
  cashFlowIncome,
  cashFlowSpending,
  hasCashFlow,
  categoryLabels,
  categoryValues,
  hasCategoryChart,
  summaryCurrency,
  saasShieldCenterValue,
  showSaasShield,
  statCards,
  previewAccounts,
  hasAccounts,
  hasAlertSubs,
  previewAlertSubs,
  recentTransactions
} = storeToRefs(dashboardStore)

await useSpaceStoreFetch('dashboard-overview', () => dashboardStore.fetchOverview())
</script>

<template>
  <DashboardPageShell max-width="full" :show-guide="false">
    <DashboardPageHeader
      :title="t('dashboard.overview.title')"
      :description="t('dashboard.overview.subtitle', { name: spaceName })"
      :eyebrow="spaceTypeLabel"
    >
      <template #actions>
        <UButton
          :label="t('dashboard.overview.viewAnalytics')"
          to="/dashboard/analytics"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-arrow-right"
        />
      </template>
    </DashboardPageHeader>

    <div class="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
      <DashboardStatsCard
        v-for="card in statCards"
        :key="card.key"
        :title="card.title"
        :value="card.value"
        :change="card.change"
        :change-positive="card.changePositive"
        :icon="card.icon"
        :loading="statsLoading"
      />
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div :class="showSaasShield ? 'xl:col-span-8' : 'xl:col-span-12'">
        <DashboardChartsChartCard
          :title="t('dashboard.overview.cashFlowChart')"
          :subtitle="t('dashboard.analytics.cashFlowHint')"
          large
        >
          <DashboardChartsCashFlowChart
            v-if="hasCashFlow"
            :labels="cashFlowLabels"
            :income="cashFlowIncome"
            :spending="cashFlowSpending"
            :currency="summaryCurrency"
          />
          <div v-else class="flex h-full items-center justify-center text-sm text-muted">
            {{ t('dashboard.analytics.emptyDescription') }}
          </div>
        </DashboardChartsChartCard>
      </div>

      <div v-if="showSaasShield" class="xl:col-span-4">
        <DashboardChartsChartCard
          :title="t('dashboard.overview.saasShield')"
          :subtitle="t('dashboard.overview.saasShieldHint')"
        >
          <DashboardChartsCategoryChart
            v-if="hasCategoryChart"
            :labels="categoryLabels"
            :values="categoryValues"
            :center-value="saasShieldCenterValue"
            :center-label="t('dashboard.overview.saasIssues')"
            :currency="summaryCurrency"
          />
          <div v-else class="flex h-full flex-col items-center justify-center text-center">
            <p class="text-2xl font-semibold tabular-nums">{{ saasShieldCenterValue }}</p>
            <p class="mt-1 text-xs text-muted">{{ t('dashboard.overview.saasIssues') }}</p>
          </div>
        </DashboardChartsChartCard>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div class="lg:col-span-7">
        <UCard :ui="{ body: 'p-4 sm:p-5' }">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold sm:text-lg">
              {{ t('dashboard.overview.recentTransactions') }}
            </h2>
            <UButton
              to="/dashboard/transactions"
              :label="t('common.viewAll')"
              color="neutral"
              variant="ghost"
              size="sm"
              trailing-icon="i-lucide-arrow-right"
            />
          </div>
          <DashboardTransactionList :transactions="recentTransactions" :loading="txLoading" />
        </UCard>
      </div>

      <div class="flex flex-col gap-4 lg:col-span-5">
        <UCard :ui="{ body: 'p-4 sm:p-5' }">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold">{{ t('dashboard.overview.accounts') }}</h2>
            <UButton
              to="/dashboard/accounts"
              :label="t('common.manage')"
              color="neutral"
              variant="ghost"
              size="sm"
              trailing-icon="i-lucide-arrow-right"
            />
          </div>

          <div v-if="!hasAccounts" class="py-6 text-center">
            <UIcon name="i-lucide-landmark" class="mx-auto mb-2 size-7 text-muted opacity-40" />
            <p class="mb-3 text-sm text-muted">{{ t('dashboard.overview.noAccounts') }}</p>
            <DashboardConnectBank size="md" />
          </div>

          <ul v-else class="divide-y divide-default">
            <li
              v-for="acc in previewAccounts"
              :key="acc.id"
              class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{{ acc.name }}</p>
                <p class="mt-0.5 truncate text-xs text-muted">{{ acc.subtitle }}</p>
              </div>
              <span class="shrink-0 text-sm font-semibold tabular-nums">
                {{ acc.balanceLabel }}
              </span>
            </li>
          </ul>
        </UCard>

        <UCard v-if="showSaasShield && hasAlertSubs" :ui="{ body: 'p-4 sm:p-5', root: 'border-warning/30' }">
          <div class="mb-3 flex items-center gap-2">
            <UIcon name="i-lucide-shield-alert" class="size-4 text-warning" />
            <h2 class="text-base font-semibold text-warning">{{ t('dashboard.overview.saasAlerts') }}</h2>
          </div>
          <ul class="divide-y divide-default">
            <li v-for="sub in previewAlertSubs" :key="sub.id" class="py-2.5 first:pt-0">
              <DashboardSubscriptionCard :subscription="sub" />
            </li>
          </ul>
          <UButton
            to="/dashboard/subscriptions"
            :label="t('dashboard.overview.reviewSubscriptions')"
            color="neutral"
            variant="outline"
            size="sm"
            block
            class="mt-3"
          />
        </UCard>
      </div>
    </div>
  </DashboardPageShell>
</template>
