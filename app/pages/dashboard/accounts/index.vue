<script setup lang="ts">
// ANCHOR: Accounts page — connect banks, filter visibility
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Accounts', middleware: 'auth', keepalive: true })

const { t } = useAppI18n()
const accountsStore = useAccountsStore()
const {
  accounts,
  pending,
  visibilityFilter,
  connectVisibility,
  visibilityItems,
  connectVisibilityItems,
  summaryItems,
  teenSummaryItems,
  stripeTestMode,
  plaidSandboxMode,
  isSharedSpace,
  isSyncing,
  isTeenView
} = storeToRefs(accountsStore)

const displaySummary = computed(() =>
  isTeenView.value ? teenSummaryItems.value : summaryItems.value
)

const accountsDescription = computed(() => {
  const connected = accounts.value.length > 0
  if (isTeenView.value) {
    return connected
      ? t('dashboard.accounts.teenSubtitleConnected')
      : t('dashboard.accounts.teenSubtitle')
  }
  return connected
    ? t('dashboard.accounts.subtitleConnected')
    : t('dashboard.accounts.subtitleSimple')
})

await useSpaceStoreFetch('accounts', () => accountsStore.fetchAccounts())

useDashboardSeo('dashboard.accounts.title')
</script>

<template>
  <DashboardPageShell>
    <DashboardPageHeader
      :title="t('dashboard.accounts.title')"
      :description="accountsDescription"
    >
      <template #actions>
        <UButton
          v-if="accounts.length"
          :label="t('dashboard.analytics.syncData')"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          class="w-full sm:w-auto"
          :loading="isSyncing"
          @click="accountsStore.syncTransactions()"
        />
        <DashboardConnectBank />
      </template>
    </DashboardPageHeader>

    <UAlert
      v-if="plaidSandboxMode"
      :title="t('dashboard.accounts.plaidSandboxTitle')"
      :description="t('dashboard.accounts.plaidSandboxDescription')"
      color="info"
      variant="subtle"
      icon="i-lucide-flask-conical"
    />

    <UAlert
      v-if="stripeTestMode"
      :title="t('dashboard.accounts.stripeTestModeTitle')"
      :description="t('dashboard.accounts.stripeTestModeDescription')"
      color="warning"
      variant="subtle"
      icon="i-lucide-flask-conical"
    />

    <DashboardSummaryStrip :items="displaySummary" :loading="pending" />

    <UCard v-if="!pending && !accounts.length" :ui="{ body: 'p-6 sm:p-8' }">
      <div class="mx-auto max-w-md space-y-4 text-center">
        <div class="mx-auto flex size-12 items-center justify-center rounded-xl bg-elevated">
          <UIcon name="i-lucide-landmark" class="size-6 text-muted" />
        </div>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold">
            {{ t('dashboard.accounts.emptyTitle') }}
          </h2>
          <p class="text-sm text-muted">
            {{ isTeenView ? t('dashboard.accounts.teenEmptyDescription') : t('dashboard.accounts.emptyDescriptionSimple') }}
          </p>
        </div>
        <DashboardConnectBank
          :label="t('dashboard.accounts.connectFirst')"
          show-refresh
        />
      </div>
    </UCard>

    <template v-else>
      <UCard v-if="(isSharedSpace && !isTeenView) || accounts.length" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="space-y-3">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <UFormField v-if="isSharedSpace && !isTeenView" :label="t('dashboard.accounts.filterLabel')">
              <USelect
                v-model="visibilityFilter"
                :items="visibilityItems"
                class="w-full"
              />
            </UFormField>
            <UFormField v-if="isSharedSpace && !isTeenView" :label="t('dashboard.accounts.connectOptions')">
              <USelect
                v-model="connectVisibility"
                :items="connectVisibilityItems"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <UButton
              :label="t('dashboard.accounts.viewTransactions')"
              icon="i-lucide-arrow-left-right"
              color="neutral"
              variant="soft"
              class="flex-1"
              to="/dashboard/transactions"
            />
            <UButton
              :label="t('dashboard.overview.viewAnalytics')"
              icon="i-lucide-bar-chart-3"
              color="neutral"
              variant="soft"
              class="flex-1"
              to="/dashboard/analytics"
            />
          </div>
        </div>
      </UCard>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <UCard v-if="pending" v-for="i in 3" :key="`skeleton-${i}`" :ui="{ body: 'p-6' }">
          <div class="animate-pulse space-y-4">
            <div class="h-5 w-3/4 rounded-sm bg-elevated" />
            <div class="h-10 w-1/2 rounded-sm bg-elevated/70" />
          </div>
        </UCard>

        <DashboardAccountCard
          v-if="!pending"
          v-for="account in accounts"
          :key="account.id"
          :account="account"
        />
      </div>
    </template>
  </DashboardPageShell>
</template>
