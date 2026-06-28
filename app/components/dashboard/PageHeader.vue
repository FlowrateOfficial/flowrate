<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="space-y-1.5 min-w-0">
      <h1 class="font-display text-3xl sm:text-4xl text-flow-ink dark:text-flow-ink-dark tracking-tight">
        {{ title }}
      </h1>
      <p v-if="description" class="text-sm text-flow-muted dark:text-flow-muted-dark max-w-2xl">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
