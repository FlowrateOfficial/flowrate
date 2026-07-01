<script setup lang="ts">
// ANCHOR: Header logo with optional wordmark
const props = withDefaults(defineProps<{
  markSize?: number | string
  showWordmark?: boolean
  // NOTE - Hide wordmark on narrow screens
  compactOnMobile?: boolean
  class?: string
}>(), {
  markSize: 32,
  showWordmark: true,
  compactOnMobile: false
})
</script>

<template>
  <span
    class="inline-flex items-center gap-2.5 shrink-0"
    :class="props.class"
  >
    <BrandFlowRateMark :size="markSize" />
    <span
      v-if="showWordmark"
      class="font-display text-xl sm:text-[1.35rem] tracking-tight text-flow-ink dark:text-flow-ink-dark leading-none"
      :class="compactOnMobile && 'hidden sm:inline'"
    >
      FlowRate
    </span>
  </span>
</template>
