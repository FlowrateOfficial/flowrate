<script setup lang="ts">
import type { BudgetItem } from '~/types/budget'

const props = defineProps<{ budget: BudgetItem }>()

const { t, formatCurrency } = useAppI18n()

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
  return formatCurrency(amount, currency)
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
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <UIcon
          :name="categoryIcons[budget.category] ?? 'i-lucide-circle-dot'"
          class="size-4 shrink-0 text-muted"
        />
        <span class="truncate text-sm font-medium">{{ budget.name }}</span>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-0.5">
        <slot name="actions" />
      </div>
    </div>
    <div class="text-right">
      <span class="text-sm font-semibold tabular-nums">
        {{ fmt(budget.spent, budget.currency) }}
      </span>
      <span class="text-sm text-muted"> / {{ fmt(budget.amount, budget.currency) }}</span>
    </div>
    <UProgress
      :model-value="percentage"
      :color="statusColor"
      size="sm"
    />
    <p class="text-right text-xs text-muted">
      {{ t('dashboard.budgets.percentUsed', { percent: percentage }) }}
      <span v-if="percentage >= 90" class="ml-1 font-medium text-error">{{ t('dashboard.budgets.overBudget') }}</span>
    </p>
  </div>
</template>
