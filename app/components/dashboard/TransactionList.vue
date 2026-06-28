<script setup lang="ts">
import { formatCurrencyForLocale } from '~/utils/format'

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

const { t, getLocale, intlLocale } = useAppI18n()

function fmt(amount: number, currency: string): string {
  return formatCurrencyForLocale(Math.abs(amount), getLocale(), currency)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat(intlLocale.value, { month: 'short', day: 'numeric' }).format(new Date(dateStr))
}
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-1">
      <div v-for="i in 5" :key="i" class="flex items-center justify-between py-4 border-b border-flow-border/30 animate-pulse">
        <div class="h-4 w-40 bg-flow-secondary/60 rounded" />
        <div class="h-4 w-16 bg-flow-secondary/40 rounded" />
      </div>
    </div>

    <div v-else-if="!transactions.length" class="text-center py-14 text-flow-muted dark:text-flow-muted-dark">
      <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-3 opacity-30 stroke-[1.25]" />
      <p class="text-sm">{{ t('dashboard.transactions.empty') }}</p>
    </div>

    <ul v-else class="divide-y divide-flow-border/40 dark:divide-flow-border-dark/40">
      <li
        v-for="tx in transactions"
        :key="tx.id"
        class="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-flow-ink dark:text-flow-ink-dark truncate">
            {{ tx.merchant ?? tx.description }}
          </p>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-flow-muted dark:text-flow-muted-dark">{{ formatDate(tx.date) }}</span>
            <span v-if="tx.pending" class="text-xs text-flow-warning">· {{ t('dashboard.transactions.pending') }}</span>
          </div>
        </div>

        <span
          class="text-sm font-medium shrink-0 tabular-nums tracking-tight"
          :class="tx.amount > 0 ? 'text-flow-success' : 'text-flow-ink dark:text-flow-ink-dark'"
        >
          {{ tx.amount > 0 ? '+' : '−' }}{{ fmt(tx.amount, tx.currency) }}
        </span>
      </li>
    </ul>
  </div>
</template>
