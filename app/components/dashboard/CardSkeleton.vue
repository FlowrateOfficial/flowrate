<script setup lang="ts">
// ANCHOR: Pulse skeleton for dashboard card grids
withDefaults(defineProps<{
  count?: number
  bodyClass?: string
}>(), {
  count: 3,
  bodyClass: 'p-6'
})
</script>

<template>
  <UCard
    v-for="index in count"
    :key="`card-skeleton-${index}`"
    :ui="{ body: bodyClass }"
  >
    <div class="animate-pulse space-y-4">
      <div class="h-5 w-3/4 rounded-sm bg-elevated" />
      <div class="h-10 w-1/2 rounded-sm bg-elevated/70" />
    </div>
  </UCard>
</template>
