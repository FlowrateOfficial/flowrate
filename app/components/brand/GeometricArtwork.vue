<script setup lang="ts">
defineProps<{
  class?: string
}>()
</script>

<template>
  <div class="relative w-full aspect-4/5 max-w-xl mx-auto select-none" :class="class" aria-hidden="true">
    <!-- NOTE - Paper-cut Bauhaus composition -->
    <div class="absolute inset-[5%] rounded-full border border-flow-border/70 dark:border-flow-border-dark/70 bg-sage/4 dark:bg-sage/10" />
    <div class="absolute top-[12%] right-[8%] w-[38%] aspect-square rounded-full border border-sand/50 bg-sand/20 dark:bg-sand/10" />
    <div class="absolute bottom-[8%] left-[6%] w-[44%] h-[36%] border border-charcoal/15 dark:border-flow-ink-dark/20 bg-flow-secondary/70 dark:bg-flow-secondary-dark/50 rotate-[-4deg]" />
    <div class="absolute top-[28%] left-[14%] w-[32%] h-[28%] border border-terracotta/30 bg-terracotta/6 dark:bg-terracotta/10 rotate-6" />

    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 480 560" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- NOTE - Arch -->
      <path
        d="M240 100 A140 140 0 0 1 380 240 L240 240 Z"
        class="fill-sand/20 dark:fill-sand/8 stroke-sand/45 dark:stroke-sand/25"
        stroke-width="0.8"
      />
      <!-- NOTE - Circle outline -->
      <circle cx="360" cy="140" r="56" class="stroke-sage/45 fill-none" stroke-width="0.8" />
      <!-- NOTE - Rectangle -->
      <rect
        x="72"
        y="360"
        width="120"
        height="120"
        class="stroke-charcoal/20 dark:stroke-flow-ink-dark/25 fill-none"
        stroke-width="0.8"
        transform="rotate(-6 132 420)"
      />
      <!-- NOTE - Half circle -->
      <path
        d="M120 480 A60 60 0 0 1 240 480 L240 420 A0 0 0 0 0 120 420 Z"
        class="fill-terracotta/10 stroke-terracotta/25"
        stroke-width="0.8"
      />
    </svg>
  </div>
</template>
