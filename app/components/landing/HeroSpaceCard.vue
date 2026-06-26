<script setup lang="ts">
import type { HeroSpaceCard } from '~/stores/landing'

defineProps<{
  card: HeroSpaceCard
  class?: string
}>()
</script>

<template>
  <div
    class="editorial-card !p-5 sm:!p-6 w-[220px] sm:w-[240px]"
    :class="class"
  >
    <div class="flex items-start justify-between gap-3 mb-4">
      <BrandSpaceShape :shape="card.shape" :size="28" />
      <span class="text-[11px] text-flow-muted dark:text-flow-muted-dark tracking-wide">
        {{ card.metricLabel }}
      </span>
    </div>
    <p class="font-display text-lg text-flow-ink dark:text-flow-ink-dark mb-0.5">
      {{ card.name }}
    </p>
    <p class="text-2xl font-light tabular-nums tracking-tight text-flow-ink dark:text-flow-ink-dark mb-3">
      {{ card.metric }}
    </p>
    <BrandSparkline :data="card.sparkline" />
  </div>
</template>
