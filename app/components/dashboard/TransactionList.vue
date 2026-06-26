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

const categoryColors: Record<string, string> = {
  FOOD: 'amber',
  TRANSPORT: 'blue',
  SUBSCRIPTIONS: 'violet',
  HOUSING: 'indigo',
  UTILITIES: 'cyan',
  HEALTHCARE: 'rose',
  ENTERTAINMENT: 'pink',
  SHOPPING: 'orange',
  INCOME: 'emerald',
  SAVINGS: 'teal',
  CLOUD_INFRA: 'sky',
  DEVELOPER_TOOLS: 'purple',
  OTHER: 'neutral'
}

const categoryIcons: Record<string, string> = {
  FOOD: 'i-lucide-utensils',
  TRANSPORT: 'i-lucide-car',
  SUBSCRIPTIONS: 'i-lucide-refresh-cw',
  HOUSING: 'i-lucide-home',
  UTILITIES: 'i-lucide-zap',
  HEALTHCARE: 'i-lucide-heart-pulse',
  ENTERTAINMENT: 'i-lucide-tv',
  SHOPPING: 'i-lucide-shopping-bag',
  INCOME: 'i-lucide-arrow-down-to-line',
  SAVINGS: 'i-lucide-piggy-bank',
  CLOUD_INFRA: 'i-lucide-cloud',
  DEVELOPER_TOOLS: 'i-lucide-code-2',
  OTHER: 'i-lucide-circle-dot'
}

function fmt(amount: number, currency: string): string {
  return formatCurrencyForLocale(Math.abs(amount), getLocale(), currency)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat(intlLocale.value, { month: 'short', day: 'numeric' }).format(new Date(dateStr))
}
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="flex items-center gap-3 py-2">
        <div class="w-8 h-8 rounded-full bg-muted/50 animate-pulse shrink-0" />
        <div class="flex-1 space-y-1.5">
          <div class="h-3.5 w-40 bg-muted/50 rounded animate-pulse" />
          <div class="h-3 w-24 bg-muted/30 rounded animate-pulse" />
        </div>
        <div class="h-4 w-16 bg-muted/50 rounded animate-pulse" />
      </div>
    </div>

    <div v-else-if="!transactions.length" class="text-center py-12 text-muted">
      <UIcon name="i-lucide-inbox" class="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p class="text-sm">{{ t('dashboard.transactions.empty') }}</p>
    </div>

    <ul v-else class="divide-y divide-default">
      <li
        v-for="tx in transactions"
        :key="tx.id"
        class="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          :class="`bg-${categoryColors[tx.category] ?? 'neutral'}-100 dark:bg-${categoryColors[tx.category] ?? 'neutral'}-900/30`"
        >
          <UIcon
            :name="categoryIcons[tx.category] ?? 'i-lucide-circle-dot'"
            class="w-4 h-4"
            :class="`text-${categoryColors[tx.category] ?? 'neutral'}-600 dark:text-${categoryColors[tx.category] ?? 'neutral'}-400`"
          />
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-foreground truncate">
            {{ tx.merchant ?? tx.description }}
          </p>
          <div class="flex items-center gap-1.5 mt-0.5">
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
          class="text-sm font-semibold shrink-0 tabular-nums"
          :class="tx.amount > 0 ? 'text-success' : 'text-foreground'"
        >
          {{ tx.amount > 0 ? '+' : '' }}{{ fmt(tx.amount, tx.currency) }}
        </span>
      </li>
    </ul>
  </div>
</template>
