<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  large?: boolean
}>()
</script>

<template>
  <UCard
    class="h-full"
    :ui="{ body: 'flex h-full flex-col p-4 sm:p-5' }"
  >
    <div class="mb-3 shrink-0">
      <h3 class="text-base font-semibold tracking-tight sm:text-lg">
        {{ title }}
      </h3>
      <p
        v-if="subtitle"
        class="mt-0.5 text-xs text-muted sm:text-sm"
      >
        {{ subtitle }}
      </p>
    </div>
    <div
      class="relative min-h-0 w-full flex-1"
      :class="large ? 'min-h-[220px] sm:min-h-[260px]' : 'min-h-[180px] sm:min-h-[220px]'"
    >
      <slot />
    </div>
  </UCard>
</template>
