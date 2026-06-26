<script setup lang="ts">
import { formatCurrencyForLocale } from '~/utils/format'

definePageMeta({ layout: 'dashboard', title: 'Overview', middleware: 'auth' })

const { t, getLocale } = useAppI18n()
useSeoMeta({ title: () => `${t('dashboard.overview.title')} — ${t('common.appName')}` })

const { activeSpace, isSharedSpace } = useActiveSpace()

const { data: stats, pending: statsLoading } = await useFetch('/api/dashboard/stats')
const { data: txData, pending: txLoading } = await useFetch('/api/transactions', {
  query: { limit: 10 }
})
const { data: accounts } = await useFetch('/api/accounts')
const { data: subs } = await useFetch('/api/subscriptions', {
  query: { status: 'PRICE_CHANGED', limit: 3 }
})

function fmt(amount: number, currency = 'USD') {
  return formatCurrencyForLocale(amount, getLocale(), currency)
}
</script>

<template>
  <div class="px-6 sm:px-10 py-10 sm:py-14 space-y-12 max-w-7xl mx-auto">
    <div class="space-y-3">
      <h1 class="font-display text-3xl sm:text-4xl text-flow-ink dark:text-flow-ink-dark tracking-tight">
        {{ t('dashboard.overview.title') }}
      </h1>
      <p class="text-flow-muted dark:text-flow-muted-dark">
        {{ t('dashboard.overview.subtitle', { name: activeSpace?.name ?? 'Your' }) }}
        <span v-if="isSharedSpace && stats?.memberCount">
          · {{ t('dashboard.overview.members', { count: stats.memberCount }) }}
        </span>
      </p>
    </div>

    <div v-if="isSharedSpace && stats?.sharedBalance != null" class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="editorial-card !p-6">
        <p class="text-xs text-flow-muted dark:text-flow-muted-dark mb-2">{{ t('dashboard.overview.combined') }}</p>
        <p class="text-2xl font-light tabular-nums">{{ fmt(stats.totalBalance) }}</p>
      </div>
      <div class="editorial-card !p-6">
        <p class="text-xs text-flow-muted dark:text-flow-muted-dark mb-2">{{ t('dashboard.overview.sharedAccounts') }}</p>
        <p class="text-2xl font-light tabular-nums">{{ fmt(stats.sharedBalance) }}</p>
      </div>
      <div class="editorial-card !p-6">
        <p class="text-xs text-flow-muted dark:text-flow-muted-dark mb-2">{{ t('dashboard.overview.yourPersonal') }}</p>
        <p class="text-2xl font-light tabular-nums">{{ fmt(stats.personalBalance) }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <DashboardStatsCard
        :title="t('dashboard.overview.stats.totalBalance')"
        :value="stats?.totalBalance != null ? fmt(stats.totalBalance) : '—'"
        :change="stats?.balanceChange"
        :change-positive="!stats?.balanceChange?.startsWith('-')"
        icon="i-lucide-wallet"
        :loading="statsLoading"
      />
      <DashboardStatsCard
        :title="t('dashboard.overview.stats.monthlySpending')"
        :value="stats?.monthlySpending != null ? fmt(stats.monthlySpending) : '—'"
        :change="stats?.spendingChange"
        :change-positive="stats?.spendingChange?.startsWith('-')"
        icon="i-lucide-arrow-up-from-line"
        :loading="statsLoading"
      />
      <DashboardStatsCard
        :title="t('dashboard.overview.stats.monthlyIncome')"
        :value="stats?.monthlyIncome != null ? fmt(stats.monthlyIncome) : '—'"
        :change="stats?.incomeChange"
        :change-positive="!stats?.incomeChange?.startsWith('-')"
        icon="i-lucide-arrow-down-to-line"
        :loading="statsLoading"
      />
      <DashboardStatsCard
        :title="t('dashboard.overview.stats.netSavings')"
        :value="stats?.netSavings != null ? fmt(stats.netSavings) : '—'"
        :change="stats?.savingsChange"
        :change-positive="!stats?.savingsChange?.startsWith('-')"
        icon="i-lucide-layers"
        :loading="statsLoading"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 editorial-card">
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-display text-xl text-flow-ink dark:text-flow-ink-dark">{{ t('dashboard.overview.recentTransactions') }}</h2>
          <UButton
            to="/dashboard/transactions"
            :label="t('common.viewAll')"
            color="neutral"
            variant="ghost"
            size="xs"
            trailing-icon="i-lucide-arrow-right"
          />
        </div>

        <DashboardTransactionList
          :transactions="txData?.items ?? []"
          :loading="txLoading"
        />
      </div>

      <div class="space-y-8">
        <div class="editorial-card">
          <div class="flex items-center justify-between mb-8">
            <h2 class="font-display text-xl text-flow-ink dark:text-flow-ink-dark">{{ t('dashboard.overview.accounts') }}</h2>
            <UButton
              to="/dashboard/accounts"
              :label="t('common.manage')"
              color="neutral"
              variant="ghost"
              size="xs"
              trailing-icon="i-lucide-arrow-right"
            />
          </div>

          <div v-if="!accounts?.length" class="text-center py-10 text-flow-muted dark:text-flow-muted-dark">
            <UIcon name="i-lucide-landmark" class="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p class="text-sm">{{ t('dashboard.overview.noAccounts') }}</p>
            <UButton
              to="/dashboard/accounts"
              :label="t('dashboard.overview.connectBank')"
              size="xs"
              class="mt-3"
            />
          </div>

          <div v-else class="divide-y divide-flow-border/60 dark:divide-flow-border-dark/60">
            <div
              v-for="acc in accounts.slice(0, 4)"
              :key="acc.id"
              class="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
            >
              <p class="text-sm font-medium truncate">{{ acc.name }}</p>
              <span class="text-sm font-semibold tabular-nums ml-2 shrink-0">
                {{ fmt(acc.balance, acc.currency) }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="subs?.length" class="editorial-card">
          <div class="flex items-center gap-2 mb-6">
            <UIcon name="i-lucide-shield-alert" class="w-4 h-4 text-terracotta stroke-[1.25]" />
            <h2 class="font-display text-xl text-terracotta">{{ t('dashboard.overview.saasAlerts') }}</h2>
          </div>

          <ul class="divide-y divide-flow-border/60 dark:divide-flow-border-dark/60">
            <li v-for="sub in subs" :key="sub.id">
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
            class="mt-6"
          />
        </div>
      </div>
    </div>
  </div>
</template>
