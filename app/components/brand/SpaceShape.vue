<script setup lang="ts">
type SpaceShape = 'circle' | 'triangle' | 'semicircle' | 'square'

defineProps<{
  shape: SpaceShape
  size?: number
  class?: string
}>()
</script>

<template>
  <svg
    :width="size ?? 32"
    :height="size ?? 32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :class="class"
    aria-hidden="true"
  >
    <circle
      v-if="shape === 'circle'"
      cx="16"
      cy="16"
      r="12"
      class="stroke-sage fill-sage/10 dark:fill-sage/20"
      stroke-width="1"
    />
    <path
      v-else-if="shape === 'triangle'"
      d="M16 6 L28 26 L4 26 Z"
      class="stroke-terracotta fill-terracotta/10 dark:fill-terracotta/15"
      stroke-width="1"
    />
    <path
      v-else-if="shape === 'semicircle'"
      d="M6 22 A10 10 0 0 1 26 22 Z"
      class="stroke-sand fill-sand/20 dark:fill-sand/10"
      stroke-width="1"
    />
    <rect
      v-else
      x="7"
      y="7"
      width="18"
      height="18"
      class="stroke-charcoal fill-charcoal/5 dark:fill-flow-ink-dark/10"
      stroke-width="1"
    />
  </svg>
</template>
