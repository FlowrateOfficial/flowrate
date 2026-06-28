<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({ layout: 'dashboard', title: 'Transactions', middleware: 'auth' })

const { t } = useAppI18n()
const transactionsStore = useTransactionsStore()
const syncStore = useSyncStore()
const accountsStore = useAccountsStore()
const { accounts } = storeToRefs(accountsStore)
const {
  search,
  dateFrom,
  dateTo,
  page,
  pageSize,
  data,
  pending,
  columns,
  rows
} = storeToRefs(transactionsStore)
const { isSyncing } = storeToRefs(syncStore)

const hasConnectedAccounts = computed(() => accounts.value.length > 0)

onMounted(() => {
  if (!accounts.value.length) accountsStore.fetchAccounts()
})

async function syncAndRefresh() {
  await syncStore.syncTransactions(() => transactionsStore.fetchTransactions())
}

useSeoMeta({ title: () => `${t('dashboard.transactions.title')} — ${t('common.appName')}` })
</script>

<template>
  <div class="px-6 sm:px-10 py-10 sm:py-14 space-y-8 max-w-7xl mx-auto">
    <DashboardPageHeader
      :title="t('dashboard.transactions.title')"
      :description="t('dashboard.transactions.subtitle', { count: data?.total ?? 0 })"
    >
      <template #actions>
        <UButton
          :label="t('dashboard.transactions.exportCsv')"
          icon="i-lucide-download"
          color="neutral"
          variant="outline"
          @click="transactionsStore.exportCsv()"
        />
        <UButton
          :label="t('dashboard.analytics.syncData')"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          :loading="isSyncing"
          @click="syncAndRefresh"
        />
      </template>
    </DashboardPageHeader>

    <UCard :ui="{ body: 'p-4 sm:p-5' }">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
        <UFormField :label="t('dashboard.transactions.searchPlaceholder')" class="md:col-span-4">
          <UInput v-model="search" :placeholder="t('dashboard.transactions.searchPlaceholder')" icon="i-lucide-search" class="w-full" />
        </UFormField>
        <UFormField :label="t('dashboard.transactions.dateFrom')" class="md:col-span-2">
          <UInput v-model="dateFrom" type="date" class="w-full" />
        </UFormField>
        <UFormField :label="t('dashboard.transactions.dateTo')" class="md:col-span-2">
          <UInput v-model="dateTo" type="date" class="w-full" />
        </UFormField>
        <UFormField :label="t('dashboard.transactions.filterCategory')" class="md:col-span-3">
          <USelectMenu
            v-model="transactionsStore.selectedCategory"
            :items="transactionsStore.categorySelectItems"
            value-key="value"
            class="w-full"
          />
        </UFormField>
        <div class="md:col-span-1 flex items-end">
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="transactionsStore.clearFilters()" />
        </div>
      </div>
    </UCard>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <UTable :data="rows" :columns="columns" :loading="pending" class="min-h-[320px]">
        <template #date-cell="{ row }">
          <button type="button" class="text-sm text-muted whitespace-nowrap" @click="transactionsStore.openDetail(row.original)">
            {{ transactionsStore.formatDate(row.original.date) }}
          </button>
        </template>
        <template #description-cell="{ row }">
          <button type="button" class="min-w-0 text-left w-full" @click="transactionsStore.openDetail(row.original)">
            <p class="text-sm font-medium truncate">{{ row.original.merchant ?? row.original.description }}</p>
            <p v-if="row.original.merchant" class="text-xs text-muted truncate">{{ row.original.description }}</p>
          </button>
        </template>
        <template #category-cell="{ row }">
          <UBadge :label="transactionsStore.categoryLabel(row.original.category)" color="neutral" variant="subtle" size="xs" />
        </template>
        <template #account-cell="{ row }">
          <span class="text-sm text-muted">{{ row.original.account?.name ?? '—' }}</span>
        </template>
        <template #amount-cell="{ row }">
          <span class="text-sm font-semibold tabular-nums" :class="row.original.amount > 0 ? 'text-success' : 'text-foreground'">
            {{ row.original.amount > 0 ? '+' : '-' }}{{ transactionsStore.formatAmount(row.original.amount, row.original.currency) }}
          </span>
        </template>
        <template #empty>
          <div class="text-center py-16 px-4">
            <UIcon name="i-lucide-receipt" class="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
            <p class="font-medium mb-1">{{ t('dashboard.transactions.emptyTitle') }}</p>
            <p class="text-sm text-muted mb-4">
              {{ hasConnectedAccounts ? t('dashboard.transactions.emptyDescriptionConnected') : t('dashboard.transactions.emptyDescription') }}
            </p>
            <UButton
              v-if="!hasConnectedAccounts"
              :label="t('dashboard.overview.connectBank')"
              to="/dashboard/accounts"
              icon="i-lucide-landmark"
              size="sm"
            />
            <UButton
              v-else
              :label="t('dashboard.analytics.syncData')"
              icon="i-lucide-refresh-cw"
              size="sm"
              :loading="isSyncing"
              @click="syncAndRefresh"
            />
          </div>
        </template>
      </UTable>
      <div v-if="data?.total" class="flex justify-center p-4 border-t border-default">
        <UPagination v-model:page="page" :total="data.total" :items-per-page="pageSize" />
      </div>
    </UCard>

    <DashboardTransactionDetailDrawer />
  </div>
</template>
