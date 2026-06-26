<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Accounts', middleware: 'auth' })

const { t } = useAppI18n()
const accountsStore = useAccountsStore()
const spacesStore = useSpacesStore()
const {
  visibilityFilter,
  connectVisibility,
  isConnecting,
  connectError,
  visibilityItems,
  connectVisibilityItems,
  isSharedSpace
} = storeToRefs(accountsStore)

useSeoMeta({ title: () => `${t('dashboard.accounts.title')} — ${t('common.appName')}` })

const { data: accounts, pending, refresh } = await useFetch('/api/accounts', {
  query: computed(() => ({ visibility: visibilityFilter.value })),
  headers: computed(() => spacesStore.spaceHeaders())
})

const totalBalance = computed(() =>
  (accounts.value ?? []).reduce((sum, acc) => sum + acc.balance, 0)
)

const { public: publicConfig } = useRuntimeConfig()
const stripeTestMode = computed(() => publicConfig.stripeConfigured && !publicConfig.stripeLiveMode)
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">{{ t('dashboard.accounts.title') }}</h1>
        <p class="text-sm text-muted mt-1">
          {{ t('dashboard.accounts.count', {
            count: accounts?.length ?? 0,
            total: accountsStore.fmt(totalBalance, 'USD')
          }) }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <USelect
          v-if="isSharedSpace"
          v-model="visibilityFilter"
          :items="visibilityItems"
          class="w-40"
        />
        <USelect
          v-if="isSharedSpace"
          v-model="connectVisibility"
          :items="connectVisibilityItems"
          class="w-48"
        />
        <UButton
          :label="t('dashboard.accounts.connectBank')"
          icon="i-lucide-plus"
          :loading="isConnecting"
          @click="accountsStore.connectBank(refresh)"
        />
      </div>
    </div>

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

    <div v-if="!pending && !accounts?.length">
      <UCard class="text-center py-16">
        <UIcon name="i-lucide-landmark" class="w-12 h-12 mx-auto mb-4 text-muted opacity-40" />
        <h3 class="font-semibold mb-2">{{ t('dashboard.accounts.emptyTitle') }}</h3>
        <p class="text-sm text-muted max-w-sm mx-auto mb-6">
          {{ t('dashboard.accounts.emptyDescription') }}
        </p>
        <UButton
          :label="t('dashboard.accounts.connectFirst')"
          icon="i-lucide-plus"
          :loading="isConnecting"
          @click="accountsStore.connectBank(refresh)"
        />
      </UCard>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <template v-if="pending">
        <UCard v-for="i in 3" :key="i" class="animate-pulse">
          <div class="space-y-3">
            <div class="h-4 bg-muted/50 rounded w-3/4" />
            <div class="h-8 bg-muted/30 rounded w-1/2" />
          </div>
        </UCard>
      </template>

      <UCard v-for="account in accounts" v-else :key="account.id">
        <div class="flex items-start justify-between mb-2">
          <div>
            <p class="font-semibold">{{ account.name }}</p>
            <p class="text-xs text-muted">{{ account.institution ?? account.type }}</p>
          </div>
          <UBadge
            :label="account.visibility === 'SHARED' ? t('dashboard.accounts.shared') : t('dashboard.accounts.personal')"
            :color="account.visibility === 'SHARED' ? 'primary' : 'neutral'"
            size="xs"
            variant="subtle"
          />
        </div>
        <p class="text-2xl font-bold tabular-nums">{{ accountsStore.fmt(account.balance, account.currency) }}</p>
        <p v-if="!account.isMine && account.ownerName" class="text-xs text-muted mt-1">
          {{ t('dashboard.accounts.connectedBy', { name: account.ownerName }) }}
        </p>
      </UCard>
    </div>

    <UAlert
      icon="i-lucide-info"
      :title="t('dashboard.accounts.mixedAccountsTitle')"
      :description="t('dashboard.accounts.mixedAccountsDescription')"
      color="neutral"
      variant="subtle"
    />
  </div>
</template>
