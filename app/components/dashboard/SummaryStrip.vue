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
  <div class="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
    <UCard
      v-for="(item, index) in items"
      :key="index"
      class="min-w-0 overflow-hidden"
      :ui="{ body: 'p-3 sm:p-4' }"
    >
      <div v-if="loading" class="animate-pulse space-y-2">
        <div class="h-3.5 w-20 rounded-sm bg-elevated" />
        <div class="h-7 w-28 rounded-sm bg-elevated/70" />
      </div>
      <div v-else class="min-w-0 space-y-2">
        <div class="flex min-w-0 items-center gap-2">
          <div
            v-if="item.icon"
            class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-elevated sm:size-9"
            aria-hidden="true"
          >
            <UIcon :name="item.icon" class="size-4 text-muted" />
          </div>
          <p class="min-w-0 truncate text-xs font-medium text-muted sm:text-sm">
            {{ item.label }}
          </p>
        </div>
        <p
          class="truncate text-base font-semibold tabular-nums tracking-tight sm:text-lg xl:text-xl"
          :title="item.value"
        >
          {{ item.value }}
        </p>
        <p v-if="item.hint" class="truncate text-xs text-muted" :title="item.hint">
          {{ item.hint }}
        </p>
      </div>
    </UCard>
  </div>
</template>
