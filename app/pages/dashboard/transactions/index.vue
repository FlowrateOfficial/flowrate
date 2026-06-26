<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { formatCurrencyForLocale } from '~/utils/format'

definePageMeta({ layout: 'dashboard', title: 'Transactions', middleware: 'auth' })

const { t, getLocale, intlLocale } = useAppI18n()
useSeoMeta({ title: () => `${t('dashboard.transactions.title')} — ${t('common.appName')}` })

interface TransactionRow {
  id: string
  description: string
  merchant: string | null
  amount: number
  currency: string
  category: string
  date: string
  pending: boolean
  account: { id: string, name: string } | null
}

const categories = [
  'ALL', 'FOOD', 'TRANSPORT', 'SUBSCRIPTIONS', 'HOUSING', 'UTILITIES',
  'HEALTHCARE', 'ENTERTAINMENT', 'SHOPPING', 'SAVINGS', 'INCOME',
  'CLOUD_INFRA', 'DEVELOPER_TOOLS', 'OTHER'
]

const selectedCategory = ref('ALL')
const search = ref('')
const page = ref(1)
const pageSize = 25

const { data, pending } = await useFetch('/api/transactions', {
  query: computed(() => ({
    category: selectedCategory.value === 'ALL' ? undefined : selectedCategory.value,
    search: search.value || undefined,
    page: page.value,
    limit: pageSize
  }))
})

watch([selectedCategory, search], () => { page.value = 1 })

const columns = computed<TableColumn<TransactionRow>[]>(() => [
  { accessorKey: 'date', header: t('dashboard.transactions.columns.date') },
  { accessorKey: 'description', header: t('dashboard.transactions.columns.description') },
  { accessorKey: 'category', header: t('dashboard.transactions.columns.category') },
  { accessorKey: 'account', header: t('dashboard.transactions.columns.account') },
  {
    accessorKey: 'amount',
    header: t('dashboard.transactions.columns.amount'),
    meta: { class: { th: 'text-right', td: 'text-right' } }
  }
])

const rows = computed(() => data.value?.items ?? [])

function categoryLabel(cat: string): string {
  const key = `categories.${cat}`
  const translated = t(key)
  return translated !== key ? translated : cat
}

function formatAmount(amount: number, currency: string): string {
  return formatCurrencyForLocale(Math.abs(amount), getLocale(), currency)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat(intlLocale.value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateStr))
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-7xl mx-auto">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">{{ t('dashboard.transactions.title') }}</h1>
        <p class="text-sm text-muted mt-1">
          {{ t('dashboard.transactions.total', { count: data?.total ?? 0 }) }}
        </p>
      </div>
      <UButton
        :label="t('dashboard.transactions.exportCsv')"
        icon="i-lucide-download"
        color="neutral"
        variant="subtle"
        size="sm"
      />
    </div>

    <div class="flex flex-col sm:flex-row gap-3">
      <UInput
        v-model="search"
        :placeholder="t('dashboard.transactions.searchPlaceholder')"
        icon="i-lucide-search"
        class="flex-1"
      />
      <div class="flex gap-2 flex-wrap">
        <UButton
          v-for="cat in categories"
          :key="cat"
          :label="categoryLabel(cat)"
          size="xs"
          :color="selectedCategory === cat ? 'primary' : 'neutral'"
          :variant="selectedCategory === cat ? 'solid' : 'subtle'"
          @click="selectedCategory = cat"
        />
      </div>
    </div>

    <UCard>
      <UTable
        :data="rows"
        :columns="columns"
        :loading="pending"
      >
        <template #date-cell="{ row }">
          <span class="text-sm text-muted whitespace-nowrap">{{ formatDate(row.original.date) }}</span>
        </template>

        <template #description-cell="{ row }">
          <div>
            <p class="text-sm font-medium">{{ row.original.merchant ?? row.original.description }}</p>
            <p v-if="row.original.merchant" class="text-xs text-muted">{{ row.original.description }}</p>
          </div>
        </template>

        <template #category-cell="{ row }">
          <UBadge
            :label="categoryLabel(row.original.category)"
            color="neutral"
            variant="subtle"
            size="xs"
          />
        </template>

        <template #account-cell="{ row }">
          <span class="text-sm text-muted">{{ row.original.account?.name ?? '—' }}</span>
        </template>

        <template #amount-cell="{ row }">
          <span
            class="text-sm font-semibold tabular-nums"
            :class="row.original.amount > 0 ? 'text-success' : 'text-foreground'"
          >
            {{ row.original.amount > 0 ? '+' : '-' }}{{ formatAmount(row.original.amount, row.original.currency) }}
          </span>
        </template>
      </UTable>

      <div v-if="data?.total" class="flex justify-center p-4 border-t border-default">
        <UPagination
          v-model:page="page"
          :total="data.total"
          :items-per-page="pageSize"
        />
      </div>
    </UCard>
  </div>
</template>
