<script setup lang="ts">
import { formatCurrencyForLocale } from '~/utils/format'

interface Budget {
  id: string
  name: string
  category: string
  amount: number
  currency: string
  spent: number
  period: string
}

const props = defineProps<{ budget: Budget }>()

const { t, getLocale } = useAppI18n()

const categoryIcons: Record<string, string> = {
  FOOD: 'i-lucide-utensils',
  TRANSPORT: 'i-lucide-car',
  SUBSCRIPTIONS: 'i-lucide-refresh-cw',
  HOUSING: 'i-lucide-home',
  UTILITIES: 'i-lucide-zap',
  HEALTHCARE: 'i-lucide-heart-pulse',
  ENTERTAINMENT: 'i-lucide-tv',
  SHOPPING: 'i-lucide-shopping-bag',
  SAVINGS: 'i-lucide-piggy-bank',
  CLOUD_INFRA: 'i-lucide-cloud',
  DEVELOPER_TOOLS: 'i-lucide-code-2',
  OTHER: 'i-lucide-circle-dot'
}

function fmt(amount: number, currency: string): string {
  return formatCurrencyForLocale(amount, getLocale(), currency)
}

const percentage = computed(() => {
  const p = (props.budget.spent / props.budget.amount) * 100
  return Math.min(Math.round(p), 100)
})

const statusColor = computed(() => {
  if (percentage.value >= 90) return 'error'
  if (percentage.value >= 75) return 'warning'
  return 'primary'
})
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon
          :name="categoryIcons[budget.category] ?? 'i-lucide-circle-dot'"
          class="w-4 h-4 text-muted"
        />
        <span class="text-sm font-medium">{{ budget.name }}</span>
      </div>
      <div class="text-right">
        <span class="text-sm font-semibold tabular-nums">
          {{ fmt(budget.spent, budget.currency) }}
        </span>
        <span class="text-sm text-muted"> / {{ fmt(budget.amount, budget.currency) }}</span>
      </div>
    </div>
    <UProgress
      :model-value="percentage"
      :color="statusColor"
      size="sm"
    />
    <p class="text-xs text-muted text-right">
      {{ t('dashboard.budgets.percentUsed', { percent: percentage }) }}
      <span v-if="percentage >= 90" class="text-error ml-1 font-medium">{{ t('dashboard.budgets.overBudget') }}</span>
    </p>
  </div>
</template>
