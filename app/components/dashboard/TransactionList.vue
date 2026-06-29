<script setup lang="ts">
interface Transaction {
  id: string
  description: string
  merchant?: string | null
  amount: number
  currency: string
  category: string
  date: string
  pending: boolean
}

interface Props {
  transactions: Transaction[]
  loading?: boolean
}

defineProps<Props>()

const { t, intlLocale, formatCurrency } = useAppI18n()

function fmt(amount: number, currency: string): string {
  return formatCurrency(Math.abs(amount), currency)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat(intlLocale.value, { month: 'short', day: 'numeric' }).format(new Date(dateStr))
}
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-1">
      <div v-for="i in 5" :key="i" class="flex animate-pulse items-center justify-between border-b border-default py-3">
        <div class="h-3.5 w-36 rounded bg-elevated" />
        <div class="h-3.5 w-14 rounded bg-elevated/70" />
      </div>
    </div>

    <UEmpty
      v-else-if="!transactions.length"
      icon="i-lucide-inbox"
      :title="t('dashboard.transactions.empty')"
      variant="naked"
      size="sm"
      class="py-8"
    />

    <ul v-else class="divide-y divide-default">
      <li
        v-for="tx in transactions"
        :key="tx.id"
        class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">
            {{ tx.merchant ?? tx.description }}
          </p>
          <div class="mt-0.5 flex items-center gap-2">
            <span class="text-xs text-muted">{{ formatDate(tx.date) }}</span>
            <UBadge
              v-if="tx.pending"
              :label="t('dashboard.transactions.pending')"
              color="warning"
              variant="subtle"
              size="xs"
            />
          </div>
        </div>

        <span
          class="shrink-0 text-sm font-semibold tabular-nums"
          :class="tx.amount > 0 ? 'text-success' : 'text-default'"
        >
          {{ tx.amount > 0 ? '+' : '−' }}{{ fmt(tx.amount, tx.currency) }}
        </span>
      </li>
    </ul>
  </div>
</template>
