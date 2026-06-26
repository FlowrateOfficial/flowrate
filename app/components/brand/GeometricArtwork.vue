<script setup lang="ts">
defineProps<{
  class?: string
}>()
</script>

<template>
  <div class="relative w-full aspect-square max-w-lg mx-auto" :class="class" aria-hidden="true">
    <!-- Large overlapping Bauhaus composition -->
    <div class="absolute inset-[8%] rounded-full border border-flow-border/80 dark:border-flow-border-dark/80 bg-sage/5 dark:bg-sage/10 transition-transform duration-500 ease-[var(--ease-flow)]" />
    <div class="absolute inset-[18%] left-[22%] border border-terracotta/40 bg-terracotta/8 dark:bg-terracotta/12 rotate-6" />
    <div class="absolute bottom-[12%] right-[10%] w-[42%] h-[42%] rounded-full border border-sand/60 bg-sand/15 dark:bg-sand/10" />
    <div class="absolute top-[20%] left-[8%] w-[28%] h-[28%] border border-charcoal/20 dark:border-flow-ink-dark/30 bg-flow-secondary/60 dark:bg-flow-secondary-dark/40 -rotate-12" />
    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 400 400" fill="none">
      <path
        d="M200 80 A120 120 0 0 1 320 200 L200 200 Z"
        class="fill-sand/25 dark:fill-sand/10 stroke-sand/40"
        stroke-width="0.75"
      />
      <circle cx="280" cy="120" r="48" class="stroke-sage/50 fill-none" stroke-width="0.75" />
      <rect x="60" y="260" width="100" height="100" class="stroke-charcoal/25 dark:stroke-flow-ink-dark/20 fill-none" stroke-width="0.75" transform="rotate(-8 110 310)" />
    </svg>
  </div>
</template>
