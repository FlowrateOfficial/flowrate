<script setup lang="ts">
interface Props {
  title: string
  value: string
  change?: string | null
  changePositive?: boolean
  icon: string
  loading?: boolean
}

defineProps<Props>()
</script>

<template>
  <div class="editorial-card !p-6 sm:!p-8">
    <div class="flex items-start justify-between gap-6">
      <div class="flex-1 min-w-0 space-y-3">
        <p class="text-xs tracking-wide text-flow-muted dark:text-flow-muted-dark">
          {{ title }}
        </p>
        <div v-if="loading" class="h-9 w-28 bg-flow-secondary dark:bg-flow-secondary-dark rounded animate-pulse" />
        <p v-else class="text-3xl sm:text-4xl font-light tabular-nums tracking-tight text-flow-ink dark:text-flow-ink-dark">
          {{ value }}
        </p>
        <div v-if="change != null && change !== '' && !loading" class="flex items-center gap-2">
          <UIcon
            :name="changePositive ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
            class="w-3.5 h-3.5 stroke-[1.25]"
            :class="changePositive ? 'text-flow-success' : 'text-terracotta'"
          />
          <span
            class="text-xs tabular-nums"
            :class="changePositive ? 'text-flow-success' : 'text-terracotta'"
          >
            {{ change }}
          </span>
        </div>
      </div>
      <UIcon :name="icon" class="w-5 h-5 text-flow-muted dark:text-flow-muted-dark shrink-0 stroke-[1.25]" />
    </div>
  </div>
</template>
