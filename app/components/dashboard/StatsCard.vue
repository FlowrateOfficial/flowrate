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
  <UCard
    class="min-w-0 overflow-hidden"
    :ui="{ body: 'p-3 sm:p-4' }"
  >
    <div
      v-if="loading"
      class="animate-pulse space-y-2"
    >
      <div class="h-3.5 w-20 rounded-sm bg-elevated" />
      <div class="h-7 w-28 rounded-sm bg-elevated/70" />
    </div>
    <div
      v-else
      class="min-w-0 space-y-2"
    >
      <div class="flex min-w-0 items-center gap-2">
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-elevated sm:size-9"
          aria-hidden="true"
        >
          <UIcon
            :name="icon"
            class="size-4 text-muted"
          />
        </div>
        <p class="min-w-0 truncate text-xs font-medium text-muted sm:text-sm">
          {{ title }}
        </p>
      </div>
      <p
        class="truncate text-base font-semibold tabular-nums tracking-tight sm:text-lg xl:text-xl"
        :title="value"
      >
        {{ value }}
      </p>
      <div
        v-if="change != null && change !== ''"
        class="flex min-w-0 items-center gap-1"
      >
        <UIcon
          :name="changePositive ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
          class="size-3 shrink-0"
          :class="changePositive ? 'text-success' : 'text-warning'"
        />
        <span
          class="truncate text-xs font-medium tabular-nums"
          :class="changePositive ? 'text-success' : 'text-warning'"
          :title="change"
        >
          {{ change }}
        </span>
      </div>
    </div>
  </UCard>
</template>
