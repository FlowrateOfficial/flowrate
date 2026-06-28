<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Accounts', middleware: 'auth' })

const { t } = useAppI18n()
const spacesStore = useSpacesStore()
const accountsStore = useAccountsStore()
const {
  accounts,
  pending,
  visibilityFilter,
  connectVisibility,
  isConnecting,
  connectError,
  visibilityItems,
  connectVisibilityItems,
  summaryItems,
  teenSummaryItems,
  stripeTestMode,
  connectItems,
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
    : t('dashboard.accounts.subtitle')
})

useSeoMeta({ title: () => `${t('dashboard.accounts.title')} — ${t('common.appName')}` })
</script>

<template>
  <div class="px-6 sm:px-10 py-10 sm:py-14 space-y-8 max-w-7xl mx-auto">
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
          :loading="isSyncing"
          @click="accountsStore.syncTransactions()"
        />
        <UDropdownMenu v-if="isSharedSpace && !isTeenView" :items="connectItems">
          <UButton
            :label="t('dashboard.accounts.connectBank')"
            icon="i-lucide-plus"
            :loading="isConnecting"
            trailing-icon="i-lucide-chevron-down"
          />
        </UDropdownMenu>
        <UButton
          v-else
          :label="t('dashboard.accounts.connectBank')"
          icon="i-lucide-plus"
          :loading="isConnecting"
          @click="accountsStore.connectBank()"
        />
      </template>
    </DashboardPageHeader>

    <UAlert
      v-if="stripeTestMode"
      :title="t('dashboard.accounts.stripeTestModeTitle')"
      :description="t('dashboard.accounts.stripeTestModeDescription')"
      color="warning"
      variant="subtle"
      icon="i-lucide-flask-conical"
    />

    <UAlert
      v-if="connectError"
      :description="connectError"
      color="error"
      variant="subtle"
      icon="i-lucide-alert-circle"
    />

    <DashboardSummaryStrip :items="displaySummary" :loading="pending" />

    <UCard v-if="(isSharedSpace && !isTeenView) || accounts.length" :ui="{ body: 'p-4 sm:p-5' }">
      <div class="flex flex-col lg:flex-row lg:items-end gap-4">
        <UFormField v-if="isSharedSpace && !isTeenView" :label="t('dashboard.accounts.filterLabel')" class="flex-1 min-w-48">
          <USelect
            v-model="visibilityFilter"
            :items="visibilityItems"
            class="w-full"
          />
        </UFormField>
        <UFormField v-if="isSharedSpace && !isTeenView" :label="t('dashboard.accounts.connectOptions')" class="flex-1 min-w-48">
          <USelect
            v-model="connectVisibility"
            :items="connectVisibilityItems"
            class="w-full"
          />
        </UFormField>
        <div class="flex flex-wrap gap-2 lg:ml-auto">
          <UButton
            :label="t('dashboard.accounts.viewTransactions')"
            icon="i-lucide-arrow-left-right"
            color="neutral"
            variant="ghost"
            to="/dashboard/transactions"
          />
          <UButton
            :label="t('dashboard.overview.viewAnalytics')"
            icon="i-lucide-bar-chart-3"
            color="neutral"
            variant="ghost"
            to="/dashboard/analytics"
          />
        </div>
      </div>
    </UCard>

    <div v-if="!pending && !accounts.length">
      <UCard class="text-center py-16">
        <UIcon name="i-lucide-landmark" class="w-12 h-12 mx-auto mb-4 text-muted opacity-40" />
        <h3 class="font-display text-xl mb-2">{{ t('dashboard.accounts.emptyTitle') }}</h3>
        <p class="text-sm text-muted max-w-md mx-auto mb-6">
          {{ isTeenView ? t('dashboard.accounts.teenEmptyDescription') : t('dashboard.accounts.emptyDescription') }}
        </p>
        <UButton
          :label="t('dashboard.accounts.connectFirst')"
          icon="i-lucide-plus"
          :loading="isConnecting"
          @click="accountsStore.connectBank()"
        />
        <UButton
          class="mt-3"
          :label="t('dashboard.accounts.resyncFromStripe')"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          :loading="isConnecting"
          @click="accountsStore.resyncFromStripe()"
        />
      </UCard>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <template v-if="pending">
        <UCard v-for="i in 3" :key="i" class="animate-pulse">
          <div class="space-y-3 p-1">
            <div class="h-4 bg-muted/50 rounded w-3/4" />
            <div class="h-8 bg-muted/30 rounded w-1/2" />
          </div>
        </UCard>
      </template>

      <DashboardAccountCard
        v-for="account in accounts"
        v-else
        :key="account.id"
        :account="account"
      />
    </div>

    <UAlert
      v-if="!isSharedSpace && !spacesStore.isMinor"
      :title="t('dashboard.accounts.sharedSpaceHintTitle')"
      :description="t('dashboard.accounts.sharedSpaceHintDescription')"
      color="neutral"
      variant="subtle"
      icon="i-lucide-users"
    />

    <UAlert
      v-if="!spacesStore.isMinor"
      icon="i-lucide-info"
      :title="t('dashboard.accounts.mixedAccountsTitle')"
      :description="t('dashboard.accounts.mixedAccountsDescription')"
      color="neutral"
      variant="subtle"
    />
  </div>
</template>
