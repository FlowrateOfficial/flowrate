<script setup lang="ts">
// NOTE - ANCHOR: Header logo — mark image + optional FlowRate wordmark
withDefaults(defineProps<{
  markSize?: number | string
  showWordmark?: boolean
  class?: string
}>(), {
  markSize: 32,
  showWordmark: true
})
</script>

<template>
  <span class="inline-flex items-center gap-2.5 shrink-0" :class="class">
    <BrandFlowRateMark :size="markSize" />
    <span
      v-if="showWordmark"
      class="font-display text-xl sm:text-[1.35rem] tracking-tight text-flow-ink dark:text-flow-ink-dark leading-none"
    >
      FlowRate
    </span>
  </span>
</template>
