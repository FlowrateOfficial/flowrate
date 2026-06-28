<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Overview', middleware: 'auth' })

const { t } = useAppI18n()
const spacesStore = useSpacesStore()
const dashboardStore = useDashboardStore()

useSeoMeta({ title: () => `${t('dashboard.overview.title')} — ${t('common.appName')}` })

const spaceId = computed(() => spacesStore.activeSpace?.id)
const {
  statsLoading,
  analyticsLoading,
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
  saasShieldCenterValue,
  statCards,
  previewAccounts,
  hasAccounts,
  hasAlertSubs,
  previewAlertSubs,
  recentTransactions
} = storeToRefs(dashboardStore)

await useAsyncData(
  () => `dashboard-overview-${spaceId.value}`,
  async () => {
    await dashboardStore.fetchOverview()
    return null
  },
  { watch: [spaceId] }
)
</script>

<template>
  <div class="px-6 sm:px-10 lg:px-14 py-12 sm:py-16 space-y-14 max-w-[90rem] mx-auto">
    <header class="grid lg:grid-cols-12 gap-6 items-end">
      <div class="lg:col-span-8 space-y-3">
        <p class="flow-section-label text-sage">{{ spaceTypeLabel }}</p>
        <h1 class="font-display text-3xl sm:text-4xl lg:text-5xl text-flow-ink dark:text-flow-ink-dark tracking-tight leading-tight">
          {{ t('dashboard.overview.title') }}
        </h1>
        <p class="text-flow-muted dark:text-flow-muted-dark text-lg max-w-xl leading-relaxed">
          {{ t('dashboard.overview.subtitle', { name: spaceName }) }}
        </p>
      </div>
      <div class="lg:col-span-4 lg:text-right">
        <UButton
          :label="t('dashboard.overview.viewAnalytics')"
          to="/dashboard/analytics"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-arrow-right"
          class="rounded-flow"
        />
      </div>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
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

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <div class="xl:col-span-8">
        <DashboardChartsChartCard
          :title="t('dashboard.overview.cashFlowChart')"
          :subtitle="t('dashboard.analytics.cashFlowHint')"
          large
        >
          <div class="flow-chart-wrap-lg">
            <DashboardChartsCashFlowChart
              v-if="hasCashFlow"
              :labels="cashFlowLabels"
              :income="cashFlowIncome"
              :spending="cashFlowSpending"
            />
            <div v-else class="flex items-center justify-center h-full text-sm text-flow-muted">
              {{ t('dashboard.analytics.emptyDescription') }}
            </div>
          </div>
        </DashboardChartsChartCard>
      </div>

      <div class="xl:col-span-4 space-y-8">
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
          />
          <div v-else class="flex flex-col items-center justify-center min-h-[200px] text-center px-4">
            <p class="text-3xl font-light tabular-nums text-flow-ink dark:text-flow-ink-dark">{{ saasShieldCenterValue }}</p>
            <p class="text-xs text-flow-muted mt-2">{{ t('dashboard.overview.saasIssues') }}</p>
          </div>
        </DashboardChartsChartCard>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-7 editorial-card-flat">
        <div class="flex items-center justify-between mb-10">
          <h2 class="font-display text-xl sm:text-2xl text-flow-ink dark:text-flow-ink-dark">
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
      </div>

      <div class="lg:col-span-5 space-y-8">
        <div class="editorial-card-flat">
          <div class="flex items-center justify-between mb-10">
            <h2 class="font-display text-xl text-flow-ink dark:text-flow-ink-dark">{{ t('dashboard.overview.accounts') }}</h2>
            <UButton
              to="/dashboard/accounts"
              :label="t('common.manage')"
              color="neutral"
              variant="ghost"
              size="sm"
              trailing-icon="i-lucide-arrow-right"
            />
          </div>

          <div v-if="!hasAccounts" class="text-center py-12 text-flow-muted dark:text-flow-muted-dark">
            <UIcon name="i-lucide-landmark" class="w-8 h-8 mx-auto mb-3 opacity-30 stroke-[1.25]" />
            <p class="text-sm mb-4">{{ t('dashboard.overview.noAccounts') }}</p>
            <UButton
              to="/dashboard/accounts"
              :label="t('dashboard.overview.connectBank')"
              size="sm"
              color="neutral"
              class="rounded-flow"
            />
          </div>

          <ul v-else class="divide-y divide-flow-border/40 dark:divide-flow-border-dark/40">
            <li
              v-for="acc in previewAccounts"
              :key="acc.id"
              class="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium truncate text-flow-ink dark:text-flow-ink-dark">{{ acc.name }}</p>
                <p class="text-xs text-flow-muted mt-0.5">{{ acc.subtitle }}</p>
              </div>
              <span class="text-sm font-medium tabular-nums shrink-0 tracking-tight">
                {{ acc.balanceLabel }}
              </span>
            </li>
          </ul>
        </div>

        <div v-if="hasAlertSubs" class="editorial-card-flat border-terracotta/20">
          <div class="flex items-center gap-2 mb-6">
            <UIcon name="i-lucide-shield-alert" class="w-4 h-4 text-terracotta stroke-[1.25]" />
            <h2 class="font-display text-lg text-terracotta">{{ t('dashboard.overview.saasAlerts') }}</h2>
          </div>
          <ul class="divide-y divide-flow-border/40 dark:divide-flow-border-dark/40">
            <li v-for="sub in previewAlertSubs" :key="sub.id" class="py-3 first:pt-0">
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
            class="mt-6 rounded-flow"
          />
        </div>
      </div>
    </div>
  </div>
</template>
