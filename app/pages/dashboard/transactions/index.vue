<script setup lang="ts">
// ANCHOR: Transactions page — filters, infinite scroll, export
import type { TableRow } from '@nuxt/ui'
import { storeToRefs } from 'pinia'
import { useInfiniteScroll } from '@vueuse/core'
import type { TransactionRow } from '~/types/financial'

definePageMeta({ layout: 'dashboard', title: 'Transactions', middleware: 'auth' })

const { t } = useAppI18n()
const transactionsStore = useTransactionsStore()
const syncStore = useSyncStore()
const accountsStore = useAccountsStore()
const { has } = usePlanFeatures()
const {
  search,
  dateFrom,
  dateTo,
  timeFrom,
  timeTo,
  items,
  total,
  hasMore,
  pending,
  loadingMore,
  columns
} = storeToRefs(transactionsStore)
const { isSyncing } = storeToRefs(syncStore)

const hasConnectedAccounts = computed(() => accountsStore.accounts.length > 0)
const hasActiveFilters = computed(() =>
  Boolean(
    search.value.trim()
    || dateFrom.value
    || dateTo.value
    || timeFrom.value
    || timeTo.value
    || transactionsStore.selectedCategory !== 'ALL'
  )
)

const emptyTitle = computed(() =>
  hasActiveFilters.value
    ? t('dashboard.transactions.noResultsTitle')
    : t('dashboard.transactions.emptyTitle')
)

const emptyDescription = computed(() => {
  if (hasActiveFilters.value) return t('dashboard.transactions.noResultsDescription')
  if (hasConnectedAccounts.value) return t('dashboard.transactions.emptyDescriptionConnected')
  return t('dashboard.transactions.emptyDescription')
})

const tableLoading = computed(() => pending.value && !items.value.length)
const table = useTemplateRef('table')

await useSpaceStoreFetch('transactions', async () => {
  // NOTE - Warm accounts cache only when overview has not loaded them
  await Promise.all([
    transactionsStore.resetAndFetch(),
    accountsStore.accounts.length ? Promise.resolve() : accountsStore.fetchAccounts()
  ])
})

useDashboardSeo('dashboard.transactions.title')

onMounted(async () => {
  await nextTick()
  useInfiniteScroll(
    () => table.value?.$el,
    () => { void transactionsStore.loadMore() },
    {
      distance: 200,
      canLoadMore: () => hasMore.value && !pending.value && !loadingMore.value
    }
  )
})

function onSelect(_event: Event, row: TableRow<TransactionRow>) {
  transactionsStore.openDetail(row.original)
}

async function syncAndRefresh() {
  await syncStore.syncTransactions(() => transactionsStore.resetAndFetch())
}
</script>

<template>
  <DashboardPageShell fill :show-guide="false">
    <DashboardPageHeader
      class="shrink-0"
      :title="t('dashboard.transactions.title')"
      :description="t('dashboard.transactions.subtitle', { count: total })"
    >
      <template #actions>
        <UButton
          :label="t('dashboard.transactions.exportCsv')"
          icon="i-lucide-download"
          color="neutral"
          variant="outline"
          size="sm"
          @click="transactionsStore.exportCsv()"
        />
        <UButton
          v-if="has('auditExport')"
          :label="t('dashboard.transactions.exportAuditCsv')"
          icon="i-lucide-file-badge"
          color="primary"
          variant="soft"
          size="sm"
          :title="t('dashboard.transactions.exportAuditHelp')"
          @click="transactionsStore.exportAuditCsv()"
        />
        <UButton
          :label="t('dashboard.analytics.syncData')"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          size="sm"
          :loading="isSyncing"
          @click="syncAndRefresh"
        />
      </template>
    </DashboardPageHeader>

    <UCard class="shrink-0" :ui="{ body: 'p-3 sm:p-4' }">
      <div class="flex flex-col gap-3">
        <UFormField :label="t('dashboard.transactions.searchLabel')">
          <UInput
            v-model="search"
            :placeholder="t('dashboard.transactions.searchPlaceholder')"
            icon="i-lucide-search"
            class="w-full"
          >
            <template v-if="search.trim()" #trailing>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                :aria-label="t('common.clear')"
                @click="search = ''"
              />
            </template>
          </UInput>
        </UFormField>

        <div class="grid grid-cols-1 items-end gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
          <UFormField :label="t('dashboard.dateRange.pickRange')">
            <DashboardDateRangePicker
              v-model:date-from="dateFrom"
              v-model:date-to="dateTo"
              v-model:time-from="timeFrom"
              v-model:time-to="timeTo"
            />
          </UFormField>
          <UFormField :label="t('dashboard.transactions.filterCategory')">
            <USelectMenu
              v-model="transactionsStore.selectedCategory"
              :items="transactionsStore.categorySelectItems"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <UButton
            v-if="hasActiveFilters"
            :label="t('dashboard.transactions.clearFilters')"
            icon="i-lucide-x"
            color="neutral"
            variant="outline"
            class="w-full lg:w-auto"
            @click="transactionsStore.clearFilters()"
          />
        </div>
      </div>
    </UCard>

    <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-default bg-default">
      <UTable
        ref="table"
        :data="items"
        :columns="columns"
        :loading="tableLoading"
        sticky
        :ui="{ root: 'overflow-y-auto' }"
        class="min-h-0 flex-1 [&_tbody_tr]:cursor-pointer [&_tbody_tr:hover]:bg-elevated/50"
        @select="onSelect"
      >
        <template #date-cell="{ row }">
          <span class="whitespace-nowrap text-sm text-muted">
            {{ transactionsStore.formatDate(row.original.date) }}
          </span>
        </template>
        <template #description-cell="{ row }">
          <div class="min-w-0">
            <div class="truncate text-sm font-medium">
              {{ row.original.merchant ?? row.original.description }}
            </div>
            <div v-if="row.original.merchant" class="truncate text-xs text-muted">
              {{ row.original.description }}
            </div>
          </div>
        </template>
        <template #category-cell="{ row }">
          <UBadge
            :label="transactionsStore.categoryLabel(row.original.category)"
            color="neutral"
            variant="subtle"
            size="xs"
          />
        </template>
        <template #splitHint-cell="{ row }">
          <span v-if="row.original.splitHint || row.original.paidBy" class="text-xs text-muted">
            <span v-if="row.original.paidBy">{{ row.original.paidBy }}</span>
            <span v-if="row.original.splitHint">
              <span v-if="row.original.paidBy"> · </span>{{ row.original.splitHint }}
            </span>
          </span>
          <span v-else class="text-xs text-muted">—</span>
        </template>
        <template #account-cell="{ row }">
          <span class="truncate text-sm text-muted">{{ row.original.account?.name ?? '—' }}</span>
        </template>
        <template #amount-cell="{ row }">
          <span
            class="text-sm font-semibold tabular-nums"
            :class="row.original.amount > 0 ? 'text-success' : 'text-foreground'"
          >
            {{ row.original.amount > 0 ? '+' : '-' }}{{ transactionsStore.formatAmount(row.original.amount, row.original.currency) }}
          </span>
        </template>
        <template #empty>
          <UEmpty
            icon="i-lucide-receipt"
            :title="emptyTitle"
            :description="emptyDescription"
            variant="naked"
            size="lg"
            class="py-12"
          >
            <template #actions>
              <UButton
                v-if="hasActiveFilters"
                :label="t('dashboard.transactions.clearFilters')"
                icon="i-lucide-x"
                size="sm"
                color="neutral"
                variant="outline"
                @click="transactionsStore.clearFilters()"
              />
              <DashboardConnectBank v-else-if="!hasConnectedAccounts" size="sm" />
              <UButton
                v-else
                :label="t('dashboard.analytics.syncData')"
                icon="i-lucide-refresh-cw"
                size="sm"
                :loading="isSyncing"
                @click="syncAndRefresh"
              />
            </template>
          </UEmpty>
        </template>
      </UTable>

      <div
        v-if="items.length"
        class="flex shrink-0 items-center justify-between gap-3 border-t border-default px-4 py-2 text-xs text-muted"
      >
        <span>
          {{ t('dashboard.transactions.showingCount', { loaded: items.length, total }) }}
        </span>
        <UBadge
          v-if="loadingMore"
          color="neutral"
          variant="subtle"
          size="sm"
          :label="t('dashboard.transactions.loadingMore')"
          icon="i-lucide-loader-2"
          class="animate-pulse"
        />
        <UBadge
          v-else-if="hasMore"
          color="neutral"
          variant="subtle"
          size="sm"
          :label="t('dashboard.transactions.scrollForMore')"
        />
      </div>
    </div>

    <DashboardTransactionDetailDrawer />
  </DashboardPageShell>
</template>
