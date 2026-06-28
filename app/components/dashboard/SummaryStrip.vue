<script setup lang="ts">
export interface SummaryItem {
  label: string
  value: string
  hint?: string
  icon?: string
}

defineProps<{
  items: SummaryItem[]
  loading?: boolean
}>()
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <UCard
      v-for="(item, index) in items"
      :key="index"
      :ui="{ body: 'p-4 sm:p-5' }"
    >
      <div v-show="loading" class="space-y-2 animate-pulse">
        <div class="h-3 w-20 bg-muted/40 rounded" />
        <div class="h-7 w-28 bg-muted/30 rounded" />
      </div>
      <div v-show="!loading">
        <div class="flex items-start justify-between gap-2">
          <p class="text-xs text-flow-muted dark:text-flow-muted-dark">{{ item.label }}</p>
          <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4 text-flow-muted shrink-0 stroke-[1.25]" />
        </div>
        <p class="text-2xl font-light tabular-nums tracking-tight mt-2 text-flow-ink dark:text-flow-ink-dark">
          {{ item.value }}
        </p>
        <p v-if="item.hint" class="text-xs text-flow-muted dark:text-flow-muted-dark mt-1">{{ item.hint }}</p>
      </div>
    </UCard>
  </div>
</template>
