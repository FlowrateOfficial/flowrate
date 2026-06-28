<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  large?: boolean
}>()
</script>

<template>
  <div class="editorial-card-flat h-full flex flex-col" :class="large ? '!p-8 sm:!p-10' : ''">
    <div class="mb-8">
      <h3 class="font-display text-xl sm:text-2xl text-flow-ink dark:text-flow-ink-dark tracking-tight">{{ title }}</h3>
      <p v-if="subtitle" class="text-sm text-flow-muted dark:text-flow-muted-dark mt-2 leading-relaxed">{{ subtitle }}</p>
    </div>
    <div class="flex-1" :class="large ? 'flow-chart-wrap-lg' : 'flow-chart-wrap'">
      <slot />
    </div>
  </div>
</template>
